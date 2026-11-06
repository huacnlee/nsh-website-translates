---
title: "Seleção de texto"
description: "Views selecionáveis: uma única seleção entre os textos dentro de uma view, entre views, elementos Text e TextViews, como os textos de uma página web são selecionados."
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---


# Seleção de texto

Uma [`View`](./view.md) com `selectable` faz os textos dentro dela serem selecionados em conjunto, como os de uma página web: uma única seleção vai de um ponto em um texto até um ponto em outro, entre views, elementos [`Text`](./text.md) e [`TextView`](./text-view.md)s, na ordem de leitura. Torne a transcrição de um chat selecionável e uma seleção poderá começar em uma mensagem e terminar na seguinte; Copiar coloca o texto selecionado na área de transferência, com textos lado a lado separados por uma tabulação e os demais por uma quebra de linha. No Rust, ela é definida com `view().selectable(true)`; no TSX, com `<View selectable>`; se um texto isolado pode ser selecionado é determinado pelo estilo `userSelect`.

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

O layout e a aparência da view são os estilos do app, e seu conteúdo são seus filhos. A seleção em si é da plataforma: a view não desenha nada próprio para ela.

<a id="a-chat-transcript"></a>

## Uma transcrição de chat

Uma transcrição em uma única view selecionável é selecionada como uma só página: um arrasto começa em uma resposta e termina em outra, e Copiar leva o texto de todas as mensagens entre elas.

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

## Como uma seleção é feita

| Plataforma | Como uma seleção é feita |
|---|---|
| macOS, Windows, Linux, GPUI | Arraste sobre os textos; um clique duplo seleciona uma palavra, um clique triplo seleciona um parágrafo, e um arrasto depois deles continua por palavras ou parágrafos. Shift+clique estende a seleção. Ctrl / Cmd+A seleciona tudo na view, Ctrl / Cmd+C copia, Escape ou um toque fora limpa a seleção. |
| iOS, Android | Um toque longo seleciona uma palavra; as alças da plataforma a estendem, e o menu de edição da plataforma tem Copiar e Selecionar tudo. |
| Web | A seleção do próprio navegador, com seus gestos, menu e atalhos. |

<a id="what-it-selects"></a>

## O que ela seleciona

- **Textos que ficam de fora**: um texto com `userSelect: "none"` (`.select_none()` no Rust, a classe `select-none`; um rótulo, o título de um botão) é ignorado pela seleção e por seus gestos.
- **Views aninhadas**: uma view selecionável dentro de outra faz parte da externa, então uma única seleção cobre ambas.
- **TextView**: uma [`TextView`](./text-view.md) com `selectable` é selecionada como uma unidade própria: seus parágrafos, itens de lista, células e blocos de código são selecionados em conjunto. Dentro de uma view selecionável, ela se junta à seleção externa.
- **Textos isolados**: um texto com `userSelect: "text"` fora de qualquer view selecionável é selecionado por conta própria, como descrito em [Text](./text.md#props).
- **A aparência** é o destaque da plataforma na `selectionColor` de cada texto (`selection:text-*`).
- **Listas**: em uma [List](./list.md) virtualizada, a seleção cobre as linhas que estão montadas; as linhas recicladas fora da área visível saem dela.

<a id="related"></a>

## Relacionados

- [View](./view.md): a prop `selectable`.
- [Text](./text.md): `userSelect`, `selectionColor` e a seleção de um texto isolado.
- [TextView](./text-view.md): documentos cujos blocos são selecionados como um só.
