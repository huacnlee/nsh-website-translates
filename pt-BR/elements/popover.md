---
title: "Popover"
description: "O componente Popover: conteúdo ancorado a um gatilho, exibido acima de todo o resto, que o gatilho, um toque fora, Escape e voltar fecham, com estilo definido pelo app."
group: base
demo: el-popover
source_hash: 49f2e25232287792
---


# Popover

Um popover mostra conteúdo ao lado do seu gatilho, sobre todo o resto: detalhes, um formulário pequeno, um seletor de cor.
Pressionar o gatilho abre e fecha o popover; um pressionamento fora, Escape, o botão voltar do Android e o gesto de escape do VoiceOver o fecham. Ele é posicionado
em um lado do gatilho, vai para o outro lado quando não há espaço, fica dentro da área segura e acompanha o
gatilho durante a rolagem. Ele não desenha nada por conta própria: o popup e seu conteúdo são do app.

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

`Popover` vem de [`nsh/base`](../modules/nsh-base.md). Seu conteúdo é criado a cada abertura, então o estado dentro dele
começa do zero.

<a id="open-state"></a>

## Estado de abertura

Sem `open`, o popover mantém seu próprio estado, começando em `defaultOpen`. Com `open`, o app é o dono do estado: altere-o
em `onOpenChange({ open, reason })`, que informa cada pedido de abertura ou fechamento com o seu motivo (`"triggerPress"`,
`"pressOutside"`, `"cancel"`).

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` o mantém aberto ao pressionar Escape e voltar (`onCancel` ainda os recebe, para perguntar antes);
`closeOnPressOutside={false}` o mantém aberto em pressionamentos fora.

<a id="phones-and-desktops"></a>

## Celulares e desktops

Um popover fica ancorado ao seu gatilho em todos os dispositivos: o que ele mostra pertence ao lado do que o abriu.

- Em desktops e navegadores desktop, um pressionamento fora o fecha e segue para o que está sob o ponteiro, de modo que
  um único clique fecha o popover e também pressiona o botão em que caiu.
- Em celulares e tablets, um pressionamento fora apenas o fecha: um backdrop transparente recebe o pressionamento, como nos
  popovers do sistema.

Para uma lista de ações, use um [Menu](./menu.md), que vira uma sheet em celulares; para um painel, use um [Sheet](./sheet.md).

<a id="entrance-and-exit"></a>

## Entrada e saída

Um popover vem e vai com as suas transições. `popupStartingClass` é o visual do popup no primeiro quadro, e as
classes `transition-*` de `popupClass` o levam ao seu visual próprio: a entrada. `popupEndingClass` é o visual dele depois de
fechado: o popover permanece, sem receber pressionamentos, enquanto essas transições rodam, depois some, e `onClose` vem em seguida. Se for aberto
de novo durante a saída, ele volta ao seu visual a partir de onde está. `popupStartingStyle` e `popupEndingStyle` fazem o mesmo
com estilos inline. Quando o usuário pede menos movimento, ele aparece e some de imediato.

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

`onPosition({ placement, bounds, available })` informa para onde o popup foi: o lado do gatilho (o outro, quando
`placement` não tinha espaço), seu quadro e o espaço disponível nesse lado, para que uma seta ou uma entrada possa apontar para o gatilho.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | nenhum | Aberto, controlado pelo app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aberto no início, sem `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | O lado do gatilho em que ele fica. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Como ele se alinha ao gatilho ao longo desse lado. |
| `offset` | `.offset(..)` | `number` | `0` | O espaço entre o gatilho e o popup. |
| `margin` | `.margin(..)` | `number` | `0` | A distância que ele mantém das bordas da área segura. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape e o botão voltar do Android o fecham. |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | Um pressionamento fora o fecha. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O visual do popup, a caixa em que o conteúdo fica. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O visual do popup no primeiro quadro, sobre o seu próprio: suas transições partem dele. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O visual do popup depois de fechado, sobre o seu próprio: ele permanece enquanto suas transições rodam. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nenhum | O que o abre; o popup é posicionado em relação a ele. Enquanto o popover está aberto, suas classes `aria-expanded:` e `expandedStyle` se aplicam. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Ele abriu ou fechou, com o motivo: `"triggerPress"`, `"pressOutside"` ou `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Ele está visível. |
| `onClose` | `.on_close(\|\| ..)` | Ele sumiu, depois da saída; também quando o app o fechou. |
| `onCancel` | `.on_cancel(\|\| ..)` | O usuário tentou fechá-lo (Escape ou voltar, um pressionamento fora), tenha ele fechado ou não. |
| `onPosition` | `.on_position(\|e\| ..)` | O popup foi posicionado: `placement` (o lado em que ficou), `bounds` (seu quadro), `available` (o espaço disponível nesse lado). |

<a id="accessibility"></a>

## Acessibilidade

O gatilho informa aos leitores de tela se o popover está expandido. Escape e o botão voltar o fecham, como os usuários esperam
de um popup. Em TSX, o gatilho é o elemento que você passa, um `Button` ou uma view própria: ele recebe os pressionamentos e o
estado expandido por conta própria, então as suas classes `active:` e `activeStyle` valem enquanto ele está pressionado, e o seu `onPress`
também é executado.
