---
title: "HoverCard"
description: "Il componente HoverCard: un'anteprima di ciò a cui punta il suo trigger, mostrata mentre il puntatore si trova sul trigger, con lo stile definito dall'app."
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---

# HoverCard

Una hover card mostra l'anteprima di ciò a cui punta il suo trigger senza uscire dalla pagina: il profilo dietro una menzione, la pagina dietro un link, la quotazione dietro un ticker. Sui desktop e nei browser desktop si apre quando il puntatore si è fermato
sul trigger per `openDelay` (600 ms), oppure quando il focus da tastiera arriva sul trigger. Resta aperta mentre il
puntatore si sposta dal trigger alla card e viceversa, e finché il focus da tastiera è sul trigger o su un link o
un pulsante nella card, così tutto ciò che si trova nella card è utilizzabile sia con il puntatore sia con la tastiera. Si chiude
`closeDelay` (300 ms) dopo che il puntatore ha lasciato entrambi e il focus non è in nessuno dei due. Escape e una pressione all'esterno la chiudono
subito. Su smartphone e
tablet una pressione sul trigger la apre e la chiude, e una pressione all'esterno la chiude.

`HoverCard` di [`nsh/base`](../modules/nsh-base.md) non disegna nulla di suo: il trigger è il tuo elemento, il
popup e il suo contenuto sono tuoi.

```rust tabs
use nsh_base::hover_card;
use nsh_core::prelude::*;

fn mention() -> impl IntoElement {
    hover_card()
        .offset(px(8.0))
        .popup_class("w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg")
        .trigger(text("@ada").text_color(rgb(0x2563eb)))
        .child(text("Ada Lovelace").font_weight(FontWeight::SEMIBOLD))
        .child(text("Writes the first programs for the Analytical Engine."))
}
```

```tsx tabs
import { Text } from "nsh";
import { HoverCard } from "nsh/base";

function Mention() {
  return (
    <HoverCard
      offset={8}
      popupClass="w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg"
      trigger={<Text class="text-blue-600">@ada</Text>}
    >
      <Text class="font-semibold">Ada Lovelace</Text>
      <Text>Writes the first programs for the Analytical Engine.</Text>
    </HoverCard>
  );
}
```

Il trigger mantiene il proprio ruolo, le proprie pressioni e il proprio aspetto: una view con `role="link"` e un proprio `onPress` va comunque dove andrebbe
quando viene premuta, e la card le aggiunge un'anteprima. Il contenuto viene creato ogni volta che la card si apre, quindi può caricare ciò che mostra in quel momento. Su
smartphone e tablet, dove una pressione apre la card, il trigger indica agli screen reader se la sua card è aperta. In una
[Toolbar](./toolbar.md) il trigger può essere uno dei suoi elementi; ciò che la card mostra no: i suoi pulsanti e link mantengono
i propri Tab stop e il `disabled` della toolbar li lascia invariati.

<a id="delays"></a>

## Ritardi

`openDelay` evita che la card compaia di colpo mentre il puntatore attraversa il trigger diretto altrove; `closeDelay`
dà al puntatore il tempo di attraversare lo spazio tra il trigger e la card. Entrambi sono in millisecondi. Il puntatore e i
ritardi sono seguiti in modo nativo, quindi fermarsi su un trigger e spostarsi tra questo e la card non esegue alcun codice tuo finché
la card non si apre o non si chiude. Un `openDelay` pari a `Infinity` lascia l'apertura all'app (e a una pressione su un touch screen); un
`closeDelay` pari a `Infinity` lascia la chiusura a Escape, a una pressione all'esterno e all'app.

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## Stato di apertura

Senza `open`, la card mantiene un proprio stato, che parte da `defaultOpen`. Con `open`, lo stato appartiene all'app: modificalo in
`onOpenChange({ open, reason })`, che segnala ogni richiesta di apertura o chiusura con il suo motivo: `"hover"` (il
puntatore), `"focus"` (il focus da tastiera), `"triggerPress"` (una pressione su un touch screen), `"pressOutside"` o
`"cancel"` (Escape o indietro).

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## Ingresso e uscita

Una hover card compare e scompare con le tue transizioni, come fa un [Popover](./popover.md). `popupStartingClass` è
l'aspetto del popup nel suo primo frame, e le classi `transition-*` di `popupClass` lo portano al suo aspetto effettivo.
`popupEndingClass` è il suo aspetto una volta chiuso: la card resta, senza ricevere input dal puntatore, mentre quelle transizioni sono in corso, poi se ne va,
e `onClose` segue. Fermarsi di nuovo sul trigger mentre sta scomparendo la riporta indietro. Quando l'utente chiede meno animazioni,
appare e scompare subito.

```tsx
<HoverCard
  popupClass="rounded-xl bg-popover p-4 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  trigger={<Text>@ada</Text>}
>
  <Profile id="ada" />
</HoverCard>
```

Per impostazione predefinita si posiziona sotto il trigger (`placement`, `align`), dall'altro lato quando non c'è spazio, e resta
all'interno della safe area. `onPosition({ placement, bounds, available })` indica dove è stata posizionata.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | nessuno | Aperta, controllata dall'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aperta all'inizio, senza `open`. |
| `openDelay` | `.open_delay(..)` | `number` | `600` | Millisecondi in cui il puntatore resta sul trigger, o il focus resta su di esso, prima che si apra; `Infinity`: mai da sola. |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | Millisecondi in cui il puntatore è lontano dal trigger e dalla card, con il focus in nessuno dei due, prima che si chiuda; `Infinity`: mai da sola. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Il lato del trigger su cui si posiziona. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Come si allinea al trigger lungo quel lato. |
| `offset` | `.offset(..)` | `number` | `0` | Lo spazio tra il trigger e la card. |
| `margin` | `.margin(..)` | `number` | `0` | La distanza che mantiene dai bordi della safe area. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del popup, la card in cui si trova il contenuto. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del popup nel suo primo frame, sovrapposto al proprio: le sue transizioni partono da qui. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del popup una volta chiuso, sovrapposto al proprio: resta finché le sue transizioni sono in corso. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nessuno | Ciò di cui mostra l'anteprima; il popup viene posizionato rispetto a esso. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto, creato ogni volta che si apre. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Richiede di aprirsi o chiudersi, con il motivo: `"hover"`, `"focus"`, `"triggerPress"`, `"pressOutside"` o `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Viene mostrata. |
| `onClose` | `.on_close(\|\| ..)` | Scompare, dopo la sua uscita; anche quando è stata chiusa dall'app. |
| `onPosition` | `.on_position(\|e\| ..)` | Il popup è stato posizionato: `placement` (il lato su cui si è posizionato), `bounds` (il suo frame), `available` (lo spazio disponibile su quel lato). |

<a id="accessibility"></a>

## Accessibilità

Una hover card aggiunge qualcosa al proprio trigger: il trigger mantiene il proprio ruolo e la propria etichetta, e ciò che apre o fa quando viene premuto resta
invariato. Gli utenti da tastiera ottengono la card quando il focus si ferma sul trigger, ed Escape la chiude. La card non prende
il focus per sé, quindi Tab prosegue dal trigger come prima. I link e i pulsanti nella card ricevono il focus come altrove,
e la card resta aperta finché uno di essi lo possiede; ciò che è importante nella card dovrebbe essere raggiungibile anche dalla
pagina a cui porta il trigger.
