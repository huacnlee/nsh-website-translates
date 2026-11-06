---
title: "Popover"
description: "Il componente Popover: contenuto ancorato a un elemento di attivazione, posizionato sopra tutto il resto, che l'elemento di attivazione stesso, una pressione all'esterno, Escape e il comando indietro chiudono, con stile definito dall'app."
group: base
demo: el-popover
source_hash: 49f2e25232287792
---

# Popover

Un popover mostra un contenuto accanto al suo trigger, sopra a tutto il resto: dettagli, un piccolo modulo, un selettore di colore.
Premere il trigger lo apre e lo chiude; una pressione all'esterno, Escape, il pulsante indietro di Android e il gesto di uscita di VoiceOver lo chiudono. Viene posizionato
su un lato del trigger, passa sull'altro lato quando non c'è spazio, resta dentro la safe area e segue il
trigger durante lo scorrimento. Non disegna nulla di suo: il popup e il suo contenuto sono dell'app.

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover` proviene da [`nsh/base`](../modules/nsh-base.md). Il suo contenuto viene creato a ogni apertura, quindi lo stato al suo interno
riparte da zero.

<a id="open-state"></a>

## Stato di apertura

Senza `open`, il popover mantiene un proprio stato, che parte da `defaultOpen`. Con `open`, lo stato è dell'app: lo si modifica
in `onOpenChange({ open, reason })`, che segnala ogni richiesta di apertura o chiusura con il relativo motivo (`"triggerPress"`,
`"pressOutside"`, `"cancel"`).

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` lo mantiene aperto su Escape e indietro (`onCancel` li riceve comunque, per chiedere prima);
`closeOnPressOutside={false}` lo mantiene aperto sulle pressioni all'esterno.

<a id="phones-and-desktops"></a>

## Telefoni e desktop

Un popover è ancorato al suo trigger su ogni dispositivo: ciò che mostra appartiene a ciò che lo ha aperto.

- Sui desktop e nei browser desktop, una pressione all'esterno lo chiude e prosegue verso ciò che si trova sotto il puntatore, quindi
  un solo clic chiude il popover e preme il pulsante su cui è caduto.
- Su telefoni e tablet, una pressione all'esterno si limita a chiuderlo: un backdrop trasparente intercetta la pressione, come fanno i
  popover di sistema.

Per un elenco di azioni usa un [Menu](./menu.md), che sui telefoni diventa uno sheet; per un pannello usa uno [Sheet](./sheet.md).

<a id="entrance-and-exit"></a>

## Ingresso e uscita

Un popover compare e scompare con le tue transizioni. `popupStartingClass` è l'aspetto del popup nel suo primo frame, e le
classi `transition-*` di `popupClass` lo portano al suo aspetto definitivo: il suo ingresso. `popupEndingClass` è il suo aspetto una volta
chiuso: il popover resta, senza ricevere pressioni, mentre queste transizioni sono in corso, poi scompare, e `onClose` segue. Se viene riaperto
durante l'uscita, torna al suo aspetto a partire da dove si trova. `popupStartingStyle` e `popupEndingStyle` fanno lo stesso
con gli stili inline. Quando l'utente chiede meno movimento, compare e scompare immediatamente.

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })` indica dove è finito il popup: il lato del trigger (l'altro quando
`placement` non aveva spazio), il suo frame e lo spazio disponibile su quel lato, così una freccia o un ingresso possono puntare al trigger.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | nessuno | Aperto, controllato dall'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aperto all'inizio, senza `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Il lato del trigger su cui si posiziona. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Come si allinea al trigger lungo quel lato. |
| `offset` | `.offset(..)` | `number` | `0` | La distanza tra il trigger e il popup. |
| `margin` | `.margin(..)` | `number` | `0` | La distanza che mantiene dai bordi della safe area. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape e il pulsante indietro di Android lo chiudono. |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | Una pressione all'esterno lo chiude. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del popup, il box in cui si trova il contenuto. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del popup nel suo primo frame, sovrapposto al proprio: le sue transizioni partono da qui. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del popup una volta chiuso, sovrapposto al proprio: resta finché le sue transizioni sono in corso. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nessuno | Ciò che lo apre; il popover viene posizionato rispetto ad esso. Mentre il popover è aperto, si applicano le sue classi `aria-expanded:` e `expandedStyle`. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Si è aperto o chiuso, con il motivo: `"triggerPress"`, `"pressOutside"` o `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | È mostrato. |
| `onClose` | `.on_close(\|\| ..)` | Non c'è più, dopo la sua uscita; anche quando è stato chiuso dall'app. |
| `onCancel` | `.on_cancel(\|\| ..)` | L'utente ha provato a chiuderlo (Escape o indietro, una pressione all'esterno), che si sia chiuso o meno. |
| `onPosition` | `.on_position(\|e\| ..)` | Il popup è stato posizionato: `placement` (il lato su cui è finito), `bounds` (il suo frame), `available` (lo spazio disponibile su quel lato). |

<a id="accessibility"></a>

## Accessibilità

Il trigger indica agli screen reader se il popover è espanso. Escape e il pulsante indietro lo chiudono, come gli utenti si aspettano
da un popup. In TSX il trigger è l'elemento che passi, un `Button` o una vista tua: riceve da sé le pressioni e lo
stato espanso, quindi le sue classi `active:` e `activeStyle` si applicano mentre è premuto, e anche il suo `onPress`
viene eseguito.
