---
title: "Textauswahl"
description: "Auswählbare Views: eine einzige Auswahl über die Texte innerhalb einer View, über mehrere Views sowie über Text-Elemente und TextViews hinweg, so wie sich die Texte einer Webseite auswählen lassen."
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---


# Textauswahl

Eine [`View`](./view.md) mit `selectable` sorgt dafür, dass die Texte darin gemeinsam ausgewählt werden, wie auf einer Webseite: Eine Auswahl reicht von einer Stelle in einem Text bis zu einer Stelle in einem anderen, über Views, [`Text`](./text.md)-Elemente und [`TextView`](./text-view.md)s hinweg, in Leserichtung. Macht man ein Chat-Transkript auswählbar, kann eine Auswahl in einer Nachricht beginnen und in der nächsten enden; Kopieren legt den ausgewählten Text in die Zwischenablage, wobei nebeneinanderstehende Texte durch einen Tab und die übrigen durch einen Zeilenumbruch getrennt werden. In Rust wird es mit `view().selectable(true)` gesetzt, in TSX mit `<View selectable>`; ob ein einzelner Text ausgewählt werden kann, bestimmt sein Style `userSelect`.

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

Layout und Aussehen der View sind Sache der Styles der App, ihr Inhalt sind ihre Children. Die Auswahl selbst gehört der Plattform: Die View zeichnet dafür nichts Eigenes.

<a id="a-chat-transcript"></a>

## Ein Chat-Transkript

Ein Transkript in einer einzigen auswählbaren View wird wie eine Seite ausgewählt: Ein Ziehen beginnt in einer Antwort und endet in einer anderen, und Kopieren übernimmt den Text jeder Nachricht dazwischen.

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

## Wie eine Auswahl erfolgt

| Plattform | Wie eine Auswahl erfolgt |
|---|---|
| macOS, Windows, Linux, GPUI | Über die Texte ziehen; ein Doppelklick wählt ein Wort aus, ein Dreifachklick einen Absatz, und ein Ziehen danach geht wortweise bzw. absatzweise weiter. Shift+Klick erweitert die Auswahl. Strg / Cmd+A wählt alles in der View aus, Strg / Cmd+C kopiert, Escape oder ein Klick außerhalb hebt die Auswahl auf. |
| iOS, Android | Ein langer Druck wählt ein Wort aus; die Griffe der Plattform erweitern die Auswahl, und ihr Bearbeitungsmenü bietet Kopieren und Alles auswählen. |
| Web | Die eigene Auswahl des Browsers, mit seinen Gesten, seinem Menü und seinen Tastenkürzeln. |

<a id="what-it-selects"></a>

## Was ausgewählt wird

- **Texte, die ausgenommen sind**: Ein Text mit `userSelect: "none"` (`.select_none()` in Rust, die Klasse `select-none`; ein Label, die Beschriftung eines Buttons) wird von der Auswahl und ihren Gesten übersprungen.
- **Verschachtelte Views**: Eine auswählbare View innerhalb einer anderen ist Teil der äußeren, sodass eine Auswahl beide abdeckt.
- **TextView**: Eine [`TextView`](./text-view.md) mit `selectable` wird als eigene Einheit ausgewählt: Ihre Absätze, Listeneinträge, Zellen und Codeblöcke werden gemeinsam ausgewählt. Innerhalb einer auswählbaren View schließt sie sich der äußeren Auswahl an.
- **Einzelne Texte**: Ein Text mit `userSelect: "text"` in keiner auswählbaren View wird für sich ausgewählt, wie es [Text](./text.md#props) beschreibt.
- **Das Aussehen** ist die Hervorhebung der Plattform in der `selectionColor` (`selection:text-*`) des jeweiligen Textes.
- **Listen**: In einer virtualisierten [List](./list.md) umfasst eine Auswahl die Zeilen, die gerade eingebunden sind; Zeilen, die außerhalb des sichtbaren Bereichs recycelt wurden, verlassen die Auswahl.

<a id="related"></a>

## Siehe auch

- [View](./view.md): die Prop `selectable`.
- [Text](./text.md): `userSelect`, `selectionColor` und die Auswahl eines einzelnen Textes.
- [TextView](./text-view.md): Dokumente, deren Blöcke als Einheit ausgewählt werden.
