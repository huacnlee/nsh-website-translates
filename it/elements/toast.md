---
title: "Toast"
description: "Toast, ToastStack e ToastManager: toast senza stile come quelli di gpui-base, una root semantica con uno stato di transizione, uno stack che dispone i toast come livelli e il loro ciclo di vita headless."
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---

# Toast

I toast sono brevi messaggi mostrati per qualche istante sopra l'app: "Copiato", "Bozza eliminata · Annulla", "Invio non riuscito".
`nsh/base` ne fornisce il comportamento in tre parti senza stile, come il `gpui-base` di GPUI Kit:

- **`ToastManager`** mantiene i toast in ordine con il loro ciclo di vita: ognuno è `"starting"`, poi `"present"` una volta trascorsa
  la durata del movimento, conta alla rovescia il proprio timeout finché è presente e non in pausa, e resta `"ending"` per
  la durata dell'uscita prima di essere rimosso.
- **`ToastStack`** misura i propri toast e li dispone a partire da un bordo, con il più recente più vicino a esso: livelli sovrapposti
  quando è compresso, un elenco quando è espanso (con il puntatore sopra, o un dito appoggiato sopra), mossi con molle.
- **`Toast`** è la radice di ogni toast: il ruolo `alert`, il suo `transitionStatus` per gli stili dell'app, uno swipe che chiede di
  chiuderlo, e lo screen reader che legge la sua etichetta quando compare.

L'aspetto e il contenuto spettano all'app, così come la comodità di mostrare un toast da qualsiasi punto: un'app costruisce il
proprio `toast(...)` su questi elementi, come fa la gallery (`examples/gallery/toast.tsx`) e come le notifiche di GPUI Kit sono
costruite sui toast di `gpui-base`.

```rust tabs
use std::time::Duration;

use nsh_core::{time::now, prelude::*};

use nsh_base::{
    Anchor, ToastManager, ToastMotion, ToastOptions, ToastStackState, theme, toast, toast_stack,
};

fn toasts() -> impl IntoElement {
    let manager = stored(ToastManager::<u64, SharedString>::new(ToastMotion::sonner()));
    let shown = signal(Vec::new());
    let state = ToastStackState::new();
    let sync = move || {
        shown.set(manager.with(|m| {
            m.visible(3)
                .map(|(id, t, s)| (*id, t.clone(), s))
                .collect::<Vec<_>>()
        }))
    };
    // Advance the lifecycle while toasts are mounted, paused while expanded.
    set_interval(Duration::from_millis(50), move || {
        if manager.with(|m| m.advance(now(), state.is_expanded()).changed) {
            sync();
        }
    });
    manager.with(|m| {
        m.push(
            1,
            "Copied".into(),
            ToastOptions::timeout(Some(Duration::from_secs(5))),
            now(),
        )
    });
    sync();
    toast_stack()
        .placement(Anchor::BottomCenter)
        .state(state)
        .w(px(340.0))
        .child(each(
            shown,
            |(id, _, _)| *id,
            move |item, _| {
                toast()
                    .transition_status(move || item.get().2)
                    .accessibility_label(move || Some(item.get().1))
                    .on_dismiss_request(move || {
                        manager.with(|m| m.dismiss(&item.get().0, now()));
                    })
                    .rounded_xl()
                    .px_4()
                    .py_3()
                    .bg(move || theme().card)
                    .shadow_lg()
                    .transition_all()
                    .duration(200.0)
                    .starting_class("opacity-0 translate-y-4")
                    .ending_class("opacity-0 scale-95")
                    .child(text(move || item.get().1))
            },
        ))
}
```

```tsx tabs
import { Overlay, signal, Text, safeArea } from "nsh";
import { Toast, type ToastEntry, ToastManager, ToastStack } from "nsh/base";

const manager = new ToastManager();
const shown = signal<ToastEntry[]>([]);
const expanded = signal(false);
const sync = () => shown.set(manager.visible(3));
// Advance the lifecycle on a timer, paused while the stack is expanded.
setInterval(() => {
  if (manager.advance(expanded()).changed) sync();
}, 50);

export function toast(title: string) {
  manager.push(crypto.randomUUID(), { title }, { timeout: 5000 });
  sync();
}

export function Toaster() {
  return (
    <Overlay class="inset-x-0 bottom-0 items-center p-4" style={{ paddingBottom: safeArea().bottom + 16 }}>
      <ToastStack placement="bottomCenter" class="w-80" onExpandedChange={(e) => expanded.set(e.expanded)} onCancel={() => {
        const newest = shown().filter((t) => t.status !== "ending").at(-1);
        if (newest) { manager.dismiss(newest.id); sync(); }
      }}>
        <Each of={shown()} key={(t: ToastEntry) => t.id}>
          {(t) => (
            <Toast
              transitionStatus={t().status}
              accessibilityLabel={(t().value as { title: string }).title}
              onDismissRequest={() => { manager.dismiss(t().id); sync(); }}
              class="rounded-xl bg-card px-4 py-3 shadow-lg transition-all duration-200"
              startingClass="opacity-0 translate-y-4"
              endingClass="opacity-0 scale-95"
            >
              <Text class="font-semibold text-card-foreground">{(t().value as { title: string }).title}</Text>
            </Toast>
          )}
        </Each>
      </ToastStack>
    </Overlay>
  );
}
```

`Toast`, `ToastStack` e `ToastManager` provengono da [`nsh/base`](../modules/nsh-base.md). In Rust sono
`toast`, `toast_stack` e `ToastManager` di `nsh_base`.

## ToastManager

Il manager è headless: non renderizza nulla e non esegue alcun timer. L'app aggiunge i toast, renderizza quelli
restituiti da `visible(limit)` con il loro stato e chiama `advance` a intervalli finché ce n'è almeno uno montato, passando `paused`
mentre lo stack è espanso. In Rust è `ToastManager<I, T>` sugli id e sui valori dell'app, con un `Instant` per
ogni chiamata; in TS è una classe su id di tipo stringa e qualsiasi valore JSON, basata sull'orologio del motore (compreso
l'orologio manuale di un test).

- `push(id, value, options)` aggiunge il toast più recente, sostituendo quello con lo stesso id (di cui restituisce il valore);
  `options.timeout` è il suo tempo di permanenza in millisecondi (assente: resta finché non viene chiuso).
- `dismiss(id)` avvia l'uscita di un toast; `dismissAll()` quella di tutti, restituendone gli id.
- `advance(paused)` fa avanzare il ciclo di vita e riporta cosa è cambiato: `presented`, `ending` (il loro timeout è scaduto),
  `removed` (con i loro valori) e `changed`.
- `visible(limit)` sono i `limit` toast più recenti che non stanno terminando più quelli in uscita, dal più vecchio; `entries()`
  (in Rust `iter()`) tutti; `get(id)`, `len()`, `isEmpty()`.

`ToastMotion` contiene i token di entrambi: `duration` (400 ms: la scadenza dell'ingresso e la risposta della molla dello stack),
`exitDuration` (200 ms), `collapsedPeek` (14), `expandedGap` (14), `collapsedScaleStep` (0.05) e
`collapsedVisible` (3), quelli di Sonner (`ToastMotion::sonner()` in Rust; i campi omessi in TS mantengono questi valori).

## ToastStack

I figli dello stack sono i suoi toast, dal più vecchio. A partire dal suo bordo `placement` (`"topRight"` per impostazione predefinita; gli
ancoraggi in basso dispongono verso l'alto), i toast compressi si sovrappongono a distanza di `collapsedPeek`, ciascuno successivo più stretto di
`collapsedScaleStep`, e ne compaiono solo `collapsedVisible`; da espansi, formano un elenco con `expandedGap` di distanza. I toast che
arrivano o se ne vanno, e l'espansione, li muovono con molle a smorzamento critico. È espanso mentre il puntatore è sopra di esso
o un dito è appoggiato sopra (`onExpandedChange({ expanded })`; in Rust `ToastStackState`, che `is_expanded()` legge), così
l'app mette in pausa i timeout mentre l'utente legge o tocca i toast.

È l'app a posizionare lo stack: in un [Overlay](./overlay.md) sul bordo, all'interno della safe area. Il suo `class` e il suo `style`
ne determinano la larghezza. Finché contiene toast, ascolta Escape e il pulsante Indietro di Android (`onCancel`; `closeOnEscape={false}`
li lascia al resto dell'app): chiude il più recente.

<a id="toast-1"></a>

## Toast

Un toast è il ruolo `alert` attorno al contenuto dell'app. Il suo `transitionStatus` è quello del manager, e le sue classi di stato
lo seguono tramite `class`: `startingClass` nel suo primo frame mentre è `"starting"`, così le sue classi `transition` si animano
a partire da esso (`starting:` di Tailwind, `@starting-style` di CSS); `endingClass` mentre è `"ending"`, per la durata dell'uscita;
`swipingClass` mentre un puntatore lo trascina con uno swipe (`transition-none` lo mantiene sotto il dito).

Un dito o il mouse trascinati verso `swipeDirection` (`"right"` per impostazione predefinita; `null` disattiva lo swipe) lo spostano, una volta
che il puntatore si è mosso, così i suoi pulsanti restano pulsanti; se rilasciato oltre `swipeThreshold` punti (50) o con un flick, esce
del tutto e chiede di essere chiuso (`onDismissRequest`), altrimenti torna indietro. Lo screen reader legge la sua
`accessibilityLabel` quando compare.

<a id="toast-props"></a>

## Prop di Toast

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | La sua fase del ciclo di vita. |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | nessuno | Le sue classi nel primo frame, durante l'uscita, durante lo swipe. |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | La direzione in cui viene trascinato via con lo swipe. |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | Quanto deve andare avanti uno swipe prima che un rilascio ne chieda la chiusura. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che lo screen reader legge quando compare. |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | nessuno | L'utente lo ha rimosso con uno swipe. |

<a id="toaststack-props"></a>

## Prop di ToastStack

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | Quelli di Sonner | I suoi token di movimento. |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | Il bordo da cui dispone i toast. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Ascolta Escape e Indietro finché contiene toast. |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | nessuno | L'interazione lo ha espanso o compresso. |
| `onCancel` | `.on_cancel(..)` | `() => void` | nessuno | Escape o Indietro: chiude il più recente. |
