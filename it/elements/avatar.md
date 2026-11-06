---
title: "Avatar"
description: "I componenti Avatar e AvatarGroup: l'immagine di una persona, oppure un'alternativa durante il caricamento, in caso di errore o quando non è disponibile, con lo stato di caricamento gestito in modo nativo; e una riga di avatar che mostra i primi e rappresenta tutti gli altri."
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---

# Avatar

Un avatar mostra l'immagine di una persona: un membro di un team, l'autore di un commento, l'account in un'intestazione. Finché l'immagine non è stata caricata, quando il caricamento fallisce e quando non c'è alcuna immagine, mostra un fallback: le iniziali del `name` della persona, oppure il contenuto dell'app stessa (un'icona). Gestisce lo stato di caricamento dell'immagine, eseguito in modo nativo a partire dagli eventi di caricamento e di errore dell'immagine stessa, senza JavaScript, e ciò che ricevono gli screen reader: un'immagine etichettata con il nome della persona. L'aspetto è quello dell'app: un `Avatar` non ha dimensioni, forma, colori o font propri. Un `AvatarGroup` mostra i primi avatar di una riga e un overflow che rappresenta gli altri ("+5").

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`Avatar` e `AvatarGroup` provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `avatar()` e `avatar_group()` li creano con un setter per ogni prop (`.src(..)`, `.fallback_delay(..)`), i metodi di stile tipizzati per l'avatar stesso e `.child(..)` per ciò che sta sopra l'immagine.

## Props

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | nessuno | L'immagine, nel formato accettato da `src` di [`<Image>`](./image.md): un URL, un URI `asset:/` o `data:`, un URL `blob:` (una foto scelta dall'utente: `URL.createObjectURL(file)`) oppure un'immagine importata. Viene mostrata una volta caricata; una stringa vuota equivale a nessuna immagine. |
| `name` | `.name(..)` | `string` | nessuno | Il nome della persona: ciò che dicono gli screen reader e le iniziali che il fallback mostra quando l'app non passa alcun `fallback`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | Ciò che dicono gli screen reader, con precedenza su `name`. `""` rende l'avatar decorativo, nascosto agli screen reader. |
| `fallbackDelay` | `.fallback_delay(..)` | `number` (ms) | `0` | Per quanto tempo il fallback attende mentre l'immagine si carica, in modo che un'immagine che si carica rapidamente venga mostrata senza che il fallback lampeggi prima. `Infinity`: nessun fallback durante il caricamento, solo quando fallisce o manca. |
| `imageClass`, `imageStyle` | `.image_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'immagine: adattamento, raggio e movimento. |
| `fallbackClass`, `fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il fallback: sfondo, colore e dimensione del testo, e come allinea il proprio contenuto. |
| `fallback` | `.fallback(..)` | `JSX.Element` | le iniziali | Il contenuto del fallback al posto delle iniziali: un'icona, un segnaposto per qualcuno senza nome. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Ciò che viene mostrato sopra l'immagine: un indicatore di presenza, un badge. Gli screen reader sentono l'etichetta dell'avatar, non questi elementi (vedi [Accessibilità](#accessibility)). |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | L'avatar stesso: dimensione e forma. |

| Evento | Rust | Payload | Descrizione |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | Lo stato dell'immagine è cambiato: `"idle"` (senza `src`), `"loading"`, `"loaded"` o `"error"`. |

<a id="parts"></a>

## Parti

| Parte | Posizione | Stile |
|---|---|---|
| L'avatar | | `class`, `style` |
| Il fallback | dentro l'avatar, per primo, grande quanto esso; presente mentre l'immagine si carica (dopo `fallbackDelay`), fallisce o manca | `fallbackClass`, `fallbackStyle`; il suo contenuto sono le iniziali o `fallback` |
| L'immagine | dentro l'avatar, sopra il fallback, lo riempie | `imageClass`, `imageStyle` |
| Il contenuto dell'app | dentro l'avatar, per ultimo | i propri elementi (`children`) |

Assegna all'avatar la sua dimensione (`class="size-10"`): il fallback e l'immagine la riempiono, quindi quando il fallback scompare non viene ricalcolato alcun layout. L'immagine viene disposta fin dall'inizio, trasparente, e diventa opaca una volta caricata; il fallback a quel punto scompare. Un `transition-opacity` in `imageClass` la mostra con una dissolvenza (con movimento ridotto viene mostrata subito). Arrotonda l'immagine e il fallback (`rounded-full` su ciascuno) invece di ritagliare l'avatar, così un indicatore di presenza posto al suo bordo (`absolute bottom-0 right-0`) resta intero.

Le iniziali sono le prime lettere delle prime due parole del nome, in maiuscolo ("Ada Lovelace" diventa "AL"); una sola parola dà le sue prime due lettere ("huacnlee" diventa "HU"), e un nome in una scrittura senza distinzione tra maiuscole e minuscole dà il suo primo carattere ("王小明" diventa "王").

<a id="groups"></a>

## Gruppi

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | Vengono mostrati al massimo questi avatar, i primi; gli altri non creano view. |
| `total` | `.total(..)` | `number` | il numero di figli | Quante persone rappresenta il gruppo, quando l'app passa solo le prime. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader del gruppo. |
| `overflowClass`, `overflowStyle` | `.overflow_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La parte di overflow, dopo gli avatar mostrati. |
| `overflow` | `.overflow(..)` | `JSX.Element` | nessuno | Ciò che rappresenta le persone non mostrate ("+5", "⋯"), presente quando nel gruppo ci sono più persone degli avatar mostrati. |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader dell'overflow al posto del suo contenuto: "5 persone in più" per un "+5". |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Gli avatar, in ordine. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La riga: direzione (`flex-row`) e spaziatura. |

La sovrapposizione, gli anelli e la forma dell'overflow sono scelte dell'app: un margine negativo su ogni avatar dopo il primo (`-ml-2`) li sovrappone, e un anello del colore dello sfondo li separa. Per una lista lunga, passa le prime `limit` persone e `total`: vengono creati solo gli avatar mostrati. Il conteggio che l'overflow rappresenta è `total` meno gli avatar mostrati, che sono il minore tra il numero di figli e `limit`: `total={8}` con due figli mostra due avatar e "+6".

<a id="accessibility"></a>

## Accessibilità

- Un avatar è un'unica immagine per gli screen reader, etichettata con `accessibilityLabel` o `name`: il nome viene letto una sola volta. Il fallback e l'immagine sono nascosti agli screen reader, quindi le iniziali non vengono lette a parte. Un avatar privo di entrambi, o con `accessibilityLabel=""`, è decorativo: nascosto agli screen reader, come dovrebbe essere un avatar accanto al nome che mostra.
- Un gruppo è un gruppo, etichettato con il suo `accessibilityLabel` ("Ada, Grace e altri 5"); gli avatar mostrati sono immagini al suo interno. L'overflow viene letto come il suo contenuto ("+5"), oppure come `overflowAccessibilityLabel` ("5 persone in più") quando l'app ne fornisce uno: NSH non scrive parole proprie.
- Un avatar è un unico elemento per gli screen reader, quindi ciò che mostrano i suoi figli non viene letto a parte, e su iOS un pulsante o un link al loro interno non è raggiungibile affatto. Indica il significato di un indicatore di presenza o di un badge in `accessibilityLabel` ("Ada Lovelace, online"), e metti ciò che può essere premuto accanto all'avatar, non al suo interno.
- Nessuno dei due accetta pressioni o il focus da tastiera: inserisci un avatar in un `Button` per renderlo interattivo.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Ogni piattaforma carica l'immagine con il proprio image loader e le proprie cache (vedi [Image](./image.md)); i suoi eventi di caricamento e di errore cambiano lo stato dell'avatar in Rust, quindi un'immagine in caricamento o fallita modifica l'immagine e il fallback e nient'altro.
- L'immagine inizia a caricarsi quando ha un frame, quindi resta disposta nel layout mentre è trasparente.
