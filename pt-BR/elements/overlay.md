---
title: "Overlay"
description: "O elemento Overlay: conteúdo exibido sobre a tela, independentemente do que recorta o elemento pai, posicionado como uma caixa fixa ou ancorado a um elemento de referência que ele acompanha, com toques fora dele e a tecla Escape sendo reportados."
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---


# Overlay

Um overlay mostra seus filhos por cima de tudo na view raiz em que está: a janela, ou o diálogo ao redor dela.
O tamanho do pai, `overflow: hidden` e as scroll views não o cortam. Para todo o resto, ele fica onde você o escreveu:
lê o contexto ao redor, seus handlers são os do seu componente e ele some junto com o pai. Popovers,
menus, tooltips e sheets são construídos sobre ele; [`nsh/base`](../modules/nsh-base.md) já traz esses componentes prontos
([Popover](./popover.md), [Menu](./menu.md), [Tooltip](./tooltip.md), [Sheet](./sheet.md)), e o overlay é o que você
usa para construir os seus próprios.

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

`Overlay` vem de `nsh` em TSX e `overlay()` vem de `nsh_core::prelude` em Rust. Ele é exibido enquanto estiver na
view: coloque-o em um `If` (Rust: `when(..)`) para abri-lo e fechá-lo. Overlays exibidos depois ficam por cima dos anteriores, e
um overlay dentro de outro fica por cima dele.

<a id="placement"></a>

## Posicionamento

Sem `anchor`, um overlay é posicionado como uma caixa `position: fixed` da sua view raiz: seus `top`, `left`, `inset`,
tamanho e margens são relativos à janela inteira (ou ao diálogo). `class="inset-0"` a cobre, o que dá um backdrop ou uma
camada de janela inteira; `class="bottom-0 left-0 right-0"` é uma barra ao longo da parte inferior.

Com `anchor`, o NSH o posiciona ao lado da âncora:

- `anchor` é uma view (um `ref`), um `Point` (`{ x, y }`) nas coordenadas da view raiz, o `pageX` / `pageY` de um toque
  (um menu no ponto onde está o ponteiro), ou um `Bounds` (`{ origin, size }`) nela: o cursor de texto de um input (`pageBounds` de `onCaretMove`), onde se abrem as sugestões
  para o que está sendo digitado.
- `placement` é o lado em que ele fica: `"top"`, `"bottom"` (o padrão), `"left"` ou `"right"`. Quando não cabe
  ali e cabe do lado oposto, ele vai para lá; quando não cabe em nenhum dos dois, vai para o lado com mais espaço.
- `align` o alinha ao longo desse lado: `"start"`, `"center"` (o padrão) ou `"end"`. Acima e abaixo da âncora,
  start e end seguem a direção do layout: start é a borda esquerda, ou a borda direita em um layout da direita para a esquerda.
- `offset` é o espaço entre a âncora e o overlay; `margin` é a distância que ele mantém das bordas da
  área segura, dentro da qual ele permanece: ele desliza ao longo do seu lado para caber.

Um overlay ancorado acompanha a sua âncora: quando a âncora rola, se move ou muda de tamanho, o overlay se move junto no
mesmo frame em que o NSH faz o layout. `onPosition` informa para onde ele foi, de modo que uma seta possa apontar para a âncora ou um menu longo possa
limitar a sua altura:

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

<a id="dismissing"></a>

## Fechamento

Um overlay informa o que normalmente fecha um popup e deixa a decisão para você:

- `onPressOutside` é disparado quando um dedo ou um botão do mouse é pressionado fora do overlay, da sua âncora e dos overlays
  dentro dele. O toque segue para o que está embaixo.
- `onCancel` é disparado no Escape, no botão voltar do Android e no gesto de escape do VoiceOver no iOS, apenas para o overlay do topo que o escuta. Ele os captura
  antes das páginas e de `BackHandler`.

Para bloquear a tela atrás de um popup, coloque um segundo overlay sob ele com `class="inset-0"` e um `onPress` que feche
os dois: é assim que funcionam o [Sheet](./sheet.md) e a apresentação do [Popover](./popover.md) no celular.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | nenhum | A view, o ponto ou a caixa em relação à qual ele é posicionado. Sem uma âncora, é uma caixa fixa da sua view raiz. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | O lado da âncora em que ele fica. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Como ele se alinha à âncora ao longo desse lado. |
| `offset` | `.offset(px(..))` | `number` | `0` | O espaço entre a âncora e o overlay. |
| `margin` | `.margin(px(..))` | `number` | `0` | A distância que ele mantém das bordas da área segura. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O que ele exibe. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | Sua aparência e, sem âncora, sua posição. |

Ele também aceita as [props comuns](./index.md#common-props) de uma view.

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | Um toque foi feito fora dele, da sua âncora e dos overlays dentro dele (`pagePosition`, um `Point`). |
| `onCancel` | `.on_cancel(\|\| ..)` | Escape, o botão voltar do Android ou o gesto de escape do VoiceOver, enquanto ele for o overlay do topo que escuta. |
| `onPosition` | `.on_position(\|position\| ..)` | O NSH o posicionou: `placement` (o lado em que ele ficou), `bounds` na view raiz e `available` (um `Size`: o espaço disponível nesse lado). |

<a id="platform-notes"></a>

## Notas de plataforma

- Todas as plataformas exibem um overlay como uma view nativa da view raiz da janela (ou do diálogo), desenhada e testada para hit-testing
  como as views ao redor: UIKit, views do Android, AppKit, GTK, Win32, GPUI e o DOM.
- Um overlay dentro de um [Dialog](./dialog.md) é exibido nesse diálogo, acima do seu conteúdo.
- Os overlays permanecem na sua janela: um menu que ultrapassaria a borda da janela desliza de volta para dentro dela.
