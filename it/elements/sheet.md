---
title: "Sheet"
description: "Il componente Sheet: un pannello posizionato su un bordo dello schermo sopra uno sfondo, chiuso dallo sfondo, dal tasto Escape e dal comando Indietro, con stile definito dall'app."
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---

# Sheet

Un sheet è un pannello posizionato su un bordo dello schermo sopra un backdrop che copre il resto: filtri, un pannello di condivisione, un drawer laterale. Una pressione sul backdrop, Escape, il pulsante Indietro di Android e il gesto di uscita di VoiceOver lo chiudono. Viene mostrato sopra a tutto nella sua finestra, allo stesso modo su ogni dispositivo, e non disegna nulla di proprio: il pannello e il backdrop sono dell'app.

```rust tabs
use nsh_base::{SheetEvent, sheet};
use nsh_core::prelude::*;

fn filters(open: Signal<bool>) -> impl IntoElement {
    sheet()
        .open(move || Some(open.get()))
        .on_open_change(move |e: &SheetEvent| {
            if let SheetEvent::OpenChange(next, _) = e {
                open.set(*next);
            }
        })
        .child(
            view()
                .gap_3()
                .p_6()
                .rounded_t(px(16.0))
                .bg(white())
                .child(text("Filters").font_weight(FontWeight::SEMIBOLD))
                .child(view().on_press(move || open.set(false)).child(text("Done"))),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Sheet } from "nsh/base";

function Filters() {
  const open = signal(false);
  return (
    <>
      <View onPress={() => open.set(true)}><Text>Filters</Text></View>
      <Sheet
        open={open()}
        onOpenChange={(e) => open.set(e.open)}
        popupClass="gap-3 rounded-t-2xl bg-white p-6"
        backdropClass="bg-black/40"
      >
        <Text class="font-semibold">Filters</Text>
        <View onPress={() => open.set(false)}><Text>Done</Text></View>
      </Sheet>
    </>
  );
}
```

`Sheet` proviene da [`nsh/base`](../modules/nsh-base.md). Il suo contenuto viene creato ogni volta che si apre. `side` lo posiziona in
`"bottom"` (il valore predefinito) o in `"top"` rispetto allo schermo, largo quanto lo schermo, oppure a `"left"` o `"right"`, alto
quanto lo schermo; la sua dimensione trasversale è quella del pannello, determinata dal contenuto o da `popupClass`.

Il suo scorrimento segue la dimensione misurata del pannello mentre il contenuto viene creato o cresce durante l'ingresso. Il contenuto lazy e
gli aggiornamenti asincroni della dimensione condividono lo stesso avanzamento dell'animazione; il pannello si assesta alla sua dimensione corrente.

<a id="open-state"></a>

## Stato di apertura

Senza `open`, lo sheet mantiene un proprio stato, a partire da `defaultOpen`. Con `open`, lo stato appartiene all'app: lo si modifica in
`onOpenChange({ open, reason })`, che segnala ogni richiesta di chiusura insieme al relativo motivo (`"backdropPress"`, `"cancel"`, `"swipe"`).
`onOpen` e `onClose` lo seguono in entrata e in uscita, indipendentemente da chi lo ha aperto o chiuso.

`closeOnEscape={false}` lo mantiene aperto con Escape e Indietro, `closeOnBackdropPress={false}` con le pressioni sul backdrop;
`onCancel` le riceve comunque, per poter chiedere prima.

<a id="dragging-a-bottom-sheet"></a>

## Trascinamento di un bottom sheet

Imposta `closeOnSwipe` per fare in modo che un pannello inferiore segua il trascinamento verso il basso. Il suo backdrop sfuma in base alla distanza; rilasciando
oltre il 30% dell'altezza del pannello, o verso il basso a 800 punti al secondo, viene richiesta la chiusura con il motivo `"swipe"`.
Un trascinamento più breve fa tornare il pannello alla posizione iniziale in modo fluido. Un owner controllato può mantenere `open` a true per far tornare il pannello dopo una richiesta di chiusura.
Con il movimento ridotto, il rilascio e l'apertura/chiusura programmatiche si assestano immediatamente; il trascinamento diretto continua a seguire il dito.

Il pannello si adatta al contenuto, compresi i menu brevi; usa `popupStyle` o l'altezza di un figlio per limitare i contenuti più alti.
L'app disegna il proprio handle, che può essere qualsiasi view all'interno del pannello. Su iOS, uno `Scroll` o `List` verticale interno
consuma il trascinamento fino alla sua cima e passa al pannello il movimento verso il basso rimanente all'interno dello stesso gesto.
Su Android, desktop e web, il trascinamento dell'handle o del contenuto al di fuori di uno scroll usa il supporto nativo al pan;
gli scroll interni mantengono il normale arbitraggio dei gesti della loro piattaforma. Impostare `closeOnSwipe` a false mantiene il pannello
fermo e preserva il contenuto montato e la posizione di scroll. Gli altri lati mantengono il comportamento esistente.

<a id="native-sheets"></a>

## Sheet nativi

Uno sheet viene disegnato da NSH nella finestra dell'app, con lo stile definito dall'app. Per lo sheet presentato dalla piattaforma stessa (un page sheet
su iOS), usa un [Dialog](./dialog.md) con `presentation="pageSheet"`.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | nessuno | Aperto, controllato dall'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aperto all'inizio, senza `open`. |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Il bordo su cui si trova. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape e il pulsante Indietro di Android lo chiudono. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Una pressione sul backdrop lo chiude. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | Un pannello inferiore segue il trascinamento verso il basso e si chiude con un rilascio sufficiente. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del pannello. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del backdrop, ad esempio un colore traslucido. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Una richiesta di chiusura, con il motivo: `"backdropPress"`, `"cancel"` o `"swipe"`. |
| `onOpen` | `.on_open(\|\| ..)` | È entrato: è tutto presente. |
| `onClose` | `.on_close(\|\| ..)` | È uscito: è tutto scomparso. Anche quando l'app lo ha chiuso. |
| `onCancel` | `.on_cancel(\|\| ..)` | L'utente ha provato a chiuderlo (Escape o Indietro, una pressione sul backdrop, uno swipe abilitato), che si sia chiuso o meno. |

Sul web, l'incorporamento con `dialogs: "viewport"` presenta lo sheet e il suo backdrop sopra la pagina host,
compreso un iframe same-origin. I frame cross-origin usano [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page).
