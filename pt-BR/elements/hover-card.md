---
title: "HoverCard"
description: "O componente HoverCard: uma prévia do conteúdo para o qual seu gatilho aponta, exibida enquanto o ponteiro permanece sobre o gatilho, com estilo definido pelo app."
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---


# HoverCard

A hover card mostra uma prévia do que o gatilho indica, sem sair da página: o perfil por trás de uma menção, a página por trás de um link, a cotação por trás de um ticker. Em desktops e em navegadores desktop, ele abre quando o ponteiro permanece sobre o gatilho por `openDelay` (600 ms) ou assim que o foco do teclado chega ao gatilho. Ele permanece aberto enquanto o ponteiro se move do gatilho para o card e de volta, e enquanto o foco do teclado está no gatilho ou em um link ou botão do card, de modo que tudo no card pode ser usado tanto com o ponteiro quanto com o teclado. Ele fecha `closeDelay` (300 ms) depois que o ponteiro saiu de ambos e o foco não está em nenhum deles. Escape e um toque fora o fecham imediatamente. Em celulares e tablets, um toque no gatilho abre e fecha o card, e um toque fora o fecha.

`HoverCard` de [`nsh/base`](../modules/nsh-base.md) não desenha nada por conta própria: o gatilho é o seu elemento, e o popup e seu conteúdo também são seus.

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

O gatilho mantém seu próprio papel, seus toques e sua aparência: uma view com `role="link"` e seu próprio `onPress` continua indo para onde iria ao ser tocada, e o card apenas adiciona uma prévia a ela. O conteúdo é criado a cada abertura do card, portanto pode carregar o que exibe nesse momento. Em celulares e tablets, onde um toque abre o card, o gatilho informa aos leitores de tela se o seu card está aberto. Em uma [Toolbar](./toolbar.md), o gatilho pode ser um dos itens; o que o card exibe não é: seus botões e links mantêm seus próprios pontos de Tab, e o `disabled` da Toolbar não interfere neles.

<a id="delays"></a>

## Atrasos

`openDelay` evita que o card apareça de repente quando o ponteiro cruza o gatilho a caminho de outro lugar; `closeDelay` dá ao ponteiro tempo para atravessar o espaço entre o gatilho e o card. Ambos são em milissegundos. O ponteiro e os atrasos são acompanhados nativamente, de modo que repousar sobre um gatilho e se mover entre ele e o card não executa nenhum código seu até que o card abra ou feche. Um `openDelay` de `Infinity` deixa a abertura a cargo do app (e de um toque em uma tela sensível ao toque); um `closeDelay` de `Infinity` deixa o fechamento a cargo de Escape, de um toque fora e do app.

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## Estado de abertura

Sem `open`, o card mantém seu próprio estado, começando em `defaultOpen`. Com `open`, o app é o dono do estado: altere-o em `onOpenChange({ open, reason })`, que informa cada pedido para abrir ou fechar com o seu motivo: `"hover"` (o ponteiro), `"focus"` (o foco do teclado), `"triggerPress"` (um toque em uma tela sensível ao toque), `"pressOutside"` ou `"cancel"` (Escape ou voltar).

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## Entrada e saída

Um hover card entra e sai com as suas transições, como um [Popover](./popover.md). `popupStartingClass` é a aparência do popup no primeiro quadro, e as classes `transition-*` de `popupClass` o levam até a sua própria aparência. `popupEndingClass` é a aparência dele depois de fechado: o card permanece, sem receber o ponteiro, enquanto essas transições são executadas, depois some, e `onClose` vem em seguida. Repousar sobre o gatilho de novo enquanto ele está saindo o traz de volta. Quando o usuário pede menos movimento, ele aparece e some imediatamente.

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

Por padrão, ele aparece abaixo do gatilho (`placement`, `align`), do outro lado quando não há espaço, e permanece dentro da área segura. `onPosition({ placement, bounds, available })` informa para onde ele foi.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | nenhum | Aberto, controlado pelo app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aberto inicialmente, sem `open`. |
| `openDelay` | `.open_delay(..)` | `number` | `600` | Milissegundos em que o ponteiro permanece sobre o gatilho, ou o foco permanece nele, antes de abrir; `Infinity`: nunca abre sozinho. |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | Milissegundos em que o ponteiro está longe do gatilho e do card, com o foco em nenhum dos dois, antes de fechar; `Infinity`: nunca fecha sozinho. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | O lado do gatilho em que ele aparece. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Como ele se alinha ao gatilho ao longo desse lado. |
| `offset` | `.offset(..)` | `number` | `0` | O espaço entre o gatilho e o card. |
| `margin` | `.margin(..)` | `number` | `0` | A distância que ele mantém das bordas da área segura. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A aparência do popup, o card em que o conteúdo está. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A aparência do popup no primeiro quadro, sobreposta à sua própria: suas transições partem dela. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A aparência do popup depois de fechado, sobreposta à sua própria: ela permanece enquanto suas transições são executadas. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nenhum | O que ele mostra em prévia; o popup é posicionado em relação a ele. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo, criado a cada abertura. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Pede para abrir ou fechar, informando o motivo: `"hover"`, `"focus"`, `"triggerPress"`, `"pressOutside"` ou `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Ele é exibido. |
| `onClose` | `.on_close(\|\| ..)` | Ele sumiu, após a sua saída; também quando o app o fechou. |
| `onPosition` | `.on_position(\|e\| ..)` | O popup foi posicionado: `placement` (o lado em que ele foi), `bounds` (seu frame), `available` (o espaço disponível nesse lado). |

<a id="accessibility"></a>

## Acessibilidade

Um hover card acrescenta algo ao seu gatilho: o gatilho mantém seu papel e seu rótulo, e o que ele abre ou faz ao ser tocado continua igual. Usuários de teclado recebem o card quando o foco repousa sobre o gatilho, e Escape o fecha. O card não recebe foco por conta própria, então Tab segue adiante a partir do gatilho como antes. Links e botões no card recebem o foco como em qualquer outro lugar, e o card permanece aberto enquanto um deles o tem; o que é importante no card também deve estar acessível a partir da página para a qual o gatilho leva.
