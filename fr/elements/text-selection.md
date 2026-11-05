---
title: "Sélection de texte"
description: "Vues sélectionnables : une seule sélection à travers les textes d'une vue, entre plusieurs vues, éléments Text et TextViews, comme les textes d'une page web sont sélectionnés."
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---

# Sélection de texte

Une [`View`](./view.md) avec `selectable` fait que les textes qu'elle contient se sélectionnent ensemble, comme ceux d'une page web : une même sélection va d'un endroit d'un texte à un endroit d'un autre, à travers des vues, des éléments [`Text`](./text.md) et des [`TextView`](./text-view.md), dans l'ordre de lecture. Si vous rendez une conversation de chat sélectionnable, une sélection peut commencer dans un message et se terminer dans le suivant ; Copier place le texte sélectionné dans le presse-papiers, les textes placés côte à côte étant joints par une tabulation et les autres par un saut de ligne. En Rust, on l'active avec `view().selectable(true)`, en TSX avec `<View selectable>` ; la possibilité de sélectionner un texte isolé relève de son style `userSelect`.

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

La mise en page et l'apparence de la vue relèvent des styles de l'application, et son contenu, de ses enfants. La sélection elle-même est celle de la plateforme : la vue ne dessine rien de propre pour elle.

<a id="a-chat-transcript"></a>

## Une conversation de chat

Une conversation dans une seule vue sélectionnable se sélectionne comme une seule page : un glissement commence dans une réponse et se termine dans une autre, et Copier récupère le texte de chaque message intermédiaire.

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

## Comment une sélection est faite

| Plateforme | Comment une sélection est faite |
|---|---|
| macOS, Windows, Linux, GPUI | Glissez sur les textes ; un double clic sélectionne un mot, un triple clic un paragraphe, et un glissement qui suit se poursuit mot par mot ou paragraphe par paragraphe. Maj+clic étend la sélection. Ctrl / Cmd+A sélectionne tout le contenu de la vue, Ctrl / Cmd+C copie, Échap ou un appui à l'extérieur efface la sélection. |
| iOS, Android | Un appui long sélectionne un mot ; les poignées de la plateforme permettent de l'étendre, et son menu d'édition propose Copier et Tout sélectionner. |
| Web | La sélection propre au navigateur, avec ses gestes, son menu et ses raccourcis. |

<a id="what-it-selects"></a>

## Ce qui est sélectionné

- **Textes exclus** : un texte avec `userSelect: "none"` (`.select_none()` en Rust, la classe `select-none` ; un libellé, la légende d'un bouton) est ignoré par la sélection et ses gestes.
- **Vues imbriquées** : une vue sélectionnable à l'intérieur d'une autre fait partie de la vue extérieure, de sorte qu'une seule sélection couvre les deux.
- **TextView** : une [`TextView`](./text-view.md) avec `selectable` se sélectionne comme un ensemble à part : ses paragraphes, éléments de liste, cellules et blocs de code se sélectionnent ensemble. À l'intérieur d'une vue sélectionnable, elle rejoint la sélection extérieure.
- **Textes isolés** : un texte avec `userSelect: "text"` qui ne se trouve dans aucune vue sélectionnable se sélectionne seul, comme le décrit [Text](./text.md#props).
- **L'apparence** est la surbrillance de la plateforme, dans le `selectionColor` de chaque texte (`selection:text-*`).
- **Listes** : dans une [List](./list.md) virtualisée, une sélection couvre les lignes montées ; les lignes recyclées hors de la zone visible quittent la sélection.

<a id="related"></a>

## Voir aussi

- [View](./view.md) : la prop `selectable`.
- [Text](./text.md) : `userSelect`, `selectionColor` et la sélection d'un texte isolé.
- [TextView](./text-view.md) : les documents dont les blocs se sélectionnent comme un tout.
