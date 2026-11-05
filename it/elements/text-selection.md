---
title: "Selezione del testo"
description: "Viste selezionabili: una sola selezione attraverso i testi all'interno di una vista, tra più viste, elementi Text e TextView, come avviene per i testi di una pagina web."
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---

# Selezione del testo

Una [`View`](./view.md) con `selectable` fa sì che i testi al suo interno si selezionino insieme, come accade in una pagina web: un'unica selezione va da un punto di un testo a un punto di un altro, attraverso view, elementi [`Text`](./text.md) e [`TextView`](./text-view.md), in ordine di lettura. Rendi selezionabile la trascrizione di una chat e una selezione può iniziare in un messaggio e finire in quello successivo; Copia mette il testo selezionato negli appunti, con i testi affiancati uniti da una tabulazione e gli altri da un a capo. In Rust si imposta con `view().selectable(true)`, in TSX con `<View selectable>`; se un singolo testo possa essere selezionato dipende dal suo stile `userSelect`.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn release_notes(notes: &'static str) -> impl IntoElement {
    view()
        .selectable(true)
        .gap_3()
        .p_4()
        .child(text("Release notes").font_weight(FontWeight::SEMIBOLD))
        .child(text_view().markdown(notes))
        .child(
            view()
                .flex_row()
                .gap_2()
                .child(text("Updated").select_none().text_color(rgb(0x737373)))
                .child(text("October 21")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";

function ReleaseNotes(props: { notes: string }) {
  return (
    <View selectable class="gap-3 p-4">
      <Text class="font-semibold">Release notes</Text>
      <TextView markdown={props.notes} />
      <View class="flex-row gap-2">
        <Text style={{ userSelect: "none" }} class="text-neutral-500">Updated</Text>
        <Text>October 21</Text>
      </View>
    </View>
  );
}
```

Il layout e l'aspetto della view sono gli stili dell'app, e il suo contenuto sono i suoi figli. La selezione in sé appartiene alla piattaforma: la view non disegna nulla di proprio per essa.

<a id="a-chat-transcript"></a>

## Una trascrizione di chat

Una trascrizione in un'unica view selezionabile si seleziona come una sola pagina: un trascinamento inizia in una risposta e termina in un'altra, e Copia prende il testo di ogni messaggio intermedio.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn transcript(replies: Signal<Vec<SharedString>>) -> impl IntoElement {
    scroll().flex_1().child(
        view().selectable(true).p_4().gap_4().child(each(
            replies,
            |reply: &SharedString| reply.clone(),
            |reply, _index| text_view().markdown(move || reply.get()),
        )),
    )
}
```

```tsx tabs
import { Scroll, View } from "nsh";
import { TextView } from "nsh/base";

<Scroll class="flex-1">
  <View selectable class="gap-4 p-4">
    <Each of={replies}>{(reply) => <TextView markdown={reply()} />}</Each>
  </View>
</Scroll>
```

<a id="how-a-selection-is-made"></a>

## Come si effettua una selezione

| Piattaforma | Come si effettua una selezione |
|---|---|
| macOS, Windows, Linux, GPUI | Trascina sui testi; un doppio clic seleziona una parola, un triplo clic un paragrafo, e un trascinamento successivo prosegue per parole o paragrafi. Shift+clic estende la selezione. Ctrl / Cmd+A seleziona tutto nella view, Ctrl / Cmd+C copia, Esc o una pressione all'esterno annulla la selezione. |
| iOS, Android | Una pressione prolungata seleziona una parola; le maniglie della piattaforma la estendono, e il suo menu di modifica offre Copia e Seleziona tutto. |
| Web | La selezione nativa del browser, con i suoi gesti, il suo menu e le sue scorciatoie. |

<a id="what-it-selects"></a>

## Cosa seleziona

- **Testi esclusi**: un testo con `userSelect: "none"` (`.select_none()` in Rust, la classe `select-none`; un'etichetta, il titolo di un pulsante) viene ignorato dalla selezione e dai suoi gesti.
- **View annidate**: una view selezionabile all'interno di un'altra fa parte di quella esterna, quindi un'unica selezione copre entrambe.
- **TextView**: una [`TextView`](./text-view.md) con `selectable` si seleziona come un insieme a sé: i suoi paragrafi, elementi di elenco, celle e blocchi di codice si selezionano insieme. All'interno di una view selezionabile si unisce alla selezione esterna.
- **Testi singoli**: un testo con `userSelect: "text"` che non si trova in nessuna view selezionabile si seleziona da solo, come descritto in [Text](./text.md#props).
- **L'aspetto** è l'evidenziazione della piattaforma nel `selectionColor` di ciascun testo (`selection:text-*`).
- **Liste**: in una [List](./list.md) virtualizzata, la selezione copre le righe montate; le righe riciclate fuori dalla vista escono dalla selezione.

<a id="related"></a>

## Vedi anche

- [View](./view.md): la prop `selectable`.
- [Text](./text.md): `userSelect`, `selectionColor` e la selezione di un singolo testo.
- [TextView](./text-view.md): documenti i cui blocchi si selezionano come un tutto unico.
