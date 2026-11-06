---
title: "Switch"
description: "O componente Switch: um controle de ligar / desligar que gerencia toques, ativação por teclado, o estado desabilitado e seu papel e valor para leitores de tela, com uma trilha e um indicador que o app estiliza."
group: base
demo: el-switch
source_hash: d203427a791f5543
---


# Switch

A switch liga ou desliga uma configuração, e a mudança tem efeito imediato. Ele cuida do comportamento: pressionamentos, ativação pelo teclado, o estado desabilitado, e o papel de switch e seu valor para leitores de tela. A aparência é do app: um `Switch` não tem cores, tamanhos, movimento nem rótulo próprios. Ele é composto por um track com um thumb dentro dele, depois seus filhos (um rótulo), e o app estiliza cada parte, com classes `checked:` e `disabled:` que acompanham o switch.

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` do Rust. O valor é do app: um pressionamento informa o próximo valor com `onChange`, e o switch mostra o `checked` que o app devolve. Em Rust, `switch()` cria um, com um setter por prop (`.checked(..)`, `.track_style(..)`), um listener por evento (`.on_change(..)`), os métodos de estilo tipados para o próprio switch e `.child(..)` para o rótulo; o estilo de uma parte aceita os métodos de estado (`.checked(..)`, `.disabled_style(..)`) que acompanham o switch.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Ligado ou desligado. Um pressionamento informa o próximo valor com `onChange`; o switch mostra o valor que o app devolve. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem pressionamentos e sem feedback de pressionamento; os estilos `disabled:` se aplicam ao switch e às suas partes, e os leitores de tela dizem que ele está esmaecido. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do switch enquanto `checked` e não desabilitado, como classes `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem: o que o switch liga, quando seus filhos não têm texto que diga isso. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O track, a parte ao longo da qual o thumb se move. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O thumb, dentro do track. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nenhum | Até que distância fora de seus limites os pressionamentos ainda contam, em pontos: um número para todos os lados, ou os lados nomeados. Como o `hitSlop` de uma view. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo depois do track: um rótulo, que os leitores de tela leem. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio switch: a linha em torno do track e do rótulo. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do switch enquanto pressionado, com hover, com foco ou desabilitado, como as classes `<state>:`. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | O switch foi pressionado: um toque, um clique, Space ou Return enquanto ele tem o foco do teclado, ou a ativação por um leitor de tela. Informa o valor que o switch pede como `checked`, o oposto do `checked` que ele tem. |

Um switch desabilitado não informa nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizado com | Estados |
|---|---|---|---|
| O switch | | `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `checkedStyle`, `disabledStyle`, ...) |
| O track | o switch, primeiro | `trackClass`, `trackStyle` | `checked:`, `disabled:` acompanham o switch |
| O thumb | o track | `thumbClass`, `thumbStyle` | `checked:`, `disabled:` acompanham o switch |
| O rótulo | o switch, depois do track | seus próprios elementos (`children`) | `group-checked:` e as outras variantes `group-*:` com `group` no `class` do switch |

O thumb se move pelos seus próprios estilos `checked:`: uma translação (`checked:translate-x-5`), ou uma margem ou o alinhamento do track (`checked:justify-end` no track). Uma classe `transition-*` anima a mudança de forma nativa. Para colocar o rótulo antes do track, inverta a linha: `class="flex-row-reverse justify-between"`.

<a id="disabled"></a>

## Desabilitado

Um switch desabilitado não recebe pressionamentos, e os leitores de tela o anunciam como esmaecido. Suas classes `disabled:` e as do track e do thumb se aplicam, sobre as `checked:`:

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

<a id="a-small-target-with-hitslop"></a>

## Um alvo pequeno com hitSlop

Um switch sem rótulo ao lado pode ser menor que um dedo. `hitSlop` faz com que os pressionamentos que caem perto dele contem, em pontos além de cada lado, sem mudar seu layout nem sua aparência: um número para todos os lados, ou os lados nomeados (`{ top: 8, bottom: 8 }`), como o [`hitSlop` de uma view](./index.md#presses-and-feedback) os recebe.

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

<a id="accessibility"></a>

## Acessibilidade

- Um switch é um único elemento para leitores de tela, com o papel `"switch"` e seu valor (ligado ou desligado); o track e o
  thumb são partes dele. Seu rótulo é o texto de seus filhos; informe `accessibilityLabel` quando não houver.
- `disabled` é anunciado como a plataforma o anuncia (VoiceOver, TalkBack, UI Automation, a árvore de acessibilidade do
  navegador).
- No macOS e na web, um switch é uma parada do foco do teclado: Tab chega até ele, Space e Return o alternam, e os
  estilos `focus:` mostram onde está o foco.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: um pressionamento é um toque que termina no switch, incluindo seu rótulo.
- Desktops (macOS, Windows, Linux, GPUI) e a web: um pressionamento é um clique. No macOS e na web, Space e Return também
  alternam o switch que tem o foco do teclado.
- Todas as plataformas desenham o que o app estiliza; o thumb se move conforme os estilos e as transições do app indicam.
