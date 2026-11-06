---
title: "Sheet"
description: "O componente Sheet: um painel em uma das bordas da tela sobre um backdrop, fechado pelo backdrop, pela tecla Escape e pelo botão voltar, estilizado pelo app."
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---


# Sheet

A sheet é um painel em uma borda da tela sobre um backdrop que cobre o resto: filtros, um painel de compartilhamento, um drawer lateral. Um toque no backdrop, Escape, o botão voltar do Android e o gesto de escape do VoiceOver o fecham. Ela aparece acima de tudo na sua janela, igual em todos os dispositivos, e não desenha nada por conta própria: o painel e o backdrop são do app.

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

`Sheet` vem de [`nsh/base`](../modules/nsh-base.md). Seu conteúdo é criado a cada abertura. `side` a posiciona na parte `"bottom"` (o padrão) ou `"top"` da tela, com a largura da tela, ou à `"left"` ou à `"right"`, com a altura da tela; seu tamanho na transversal é o do painel, definido pelo conteúdo ou por `popupClass`.

Sua animação de deslize acompanha o tamanho medido do painel à medida que o conteúdo é criado ou cresce durante a entrada. Conteúdo lazy e atualizações assíncronas de tamanho compartilham o mesmo progresso de animação; o painel se estabiliza no seu tamanho atual.

<a id="open-state"></a>

## Estado de abertura

Sem `open`, a sheet mantém seu próprio estado, começando em `defaultOpen`. Com `open`, o app é o dono do estado: altere-o em `onOpenChange({ open, reason })`, que informa cada solicitação de fechamento com o motivo (`"backdropPress"`, `"cancel"`, `"swipe"`).
`onOpen` e `onClose` acompanham a entrada e a saída, independentemente de quem a abriu ou fechou.

`closeOnEscape={false}` a mantém aberta com Escape e voltar, `closeOnBackdropPress={false}` com toques no backdrop;
`onCancel` ainda os recebe, para perguntar antes.

<a id="dragging-a-bottom-sheet"></a>

## Arrastando uma bottom sheet

Defina `closeOnSwipe` para que um painel inferior acompanhe o arrasto para baixo. Seu backdrop desaparece gradualmente conforme a distância; soltar além de 30% da altura do painel, ou para baixo a 800 pontos por segundo, solicita o fechamento com o motivo `"swipe"`.
Um arrasto menor faz o painel voltar suavemente. Um dono controlado pode manter `open` como true para devolver o painel após uma solicitação de fechamento.
Com movimento reduzido, soltar e abrir/fechar programaticamente se estabilizam imediatamente; o arrasto direto ainda acompanha o dedo.

O painel se ajusta ao conteúdo, incluindo menus curtos; use `popupStyle` ou a altura de um filho para limitar conteúdos mais altos.
O app desenha seu próprio handle, que pode ser qualquer view dentro do painel. No iOS, um `Scroll` ou `List` vertical interno consome o arrasto até chegar ao topo e passa o movimento descendente restante ao painel dentro do mesmo gesto.
No Android, em desktops e na web, arrastar o handle ou o conteúdo fora de uma área rolável usa o suporte nativo a pan; rolagens internas mantêm a arbitragem de gestos normal da sua plataforma. Definir `closeOnSwipe` como false mantém o painel parado e preserva o conteúdo montado e a posição de rolagem. Os demais lados mantêm o comportamento existente.

<a id="native-sheets"></a>

## Sheets nativas

Uma sheet é desenhada pelo NSH na janela do app, com estilo definido pelo app. Para a sheet apresentada pela própria plataforma (uma page sheet no iOS), use um [Dialog](./dialog.md) com `presentation="pageSheet"`.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | nenhum | Aberta, controlada pelo app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aberta inicialmente, sem `open`. |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | A borda em que ela fica. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape e o botão voltar do Android a fecham. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Um toque no backdrop a fecha. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | Um painel inferior acompanha o arrasto para baixo e fecha ao ser solto o suficiente. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A aparência do painel. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A aparência do backdrop, como uma cor translúcida. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Uma solicitação de fechamento, com o motivo: `"backdropPress"`, `"cancel"` ou `"swipe"`. |
| `onOpen` | `.on_open(\|\| ..)` | Ela entrou: está tudo lá. |
| `onClose` | `.on_close(\|\| ..)` | Ela saiu: sumiu por completo. Também quando o app a fechou. |
| `onCancel` | `.on_cancel(\|\| ..)` | O usuário tentou fechá-la (Escape ou voltar, um toque no backdrop, um deslize habilitado), tenha ela fechado ou não. |

Na web, incorporar com `dialogs: "viewport"` apresenta a sheet e seu backdrop sobre a página host, incluindo um iframe de mesma origem. Frames de origem cruzada usam [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page).
