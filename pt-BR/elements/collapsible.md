---
title: "Collapsible"
description: "O componente Collapsible: uma região cujo conteúdo se expande e se recolhe, exibido após seus filhos enquanto o app o mantém aberto, revelado por uma altura com efeito de mola sob demanda, com o gatilho e toda a aparência definidos pelo app."
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---


# Collapsible

Um collapsible é uma região cujo conteúdo expande e recolhe: detalhes sob um resumo, um "mostrar mais", uma seção de configurações avançadas. Ele renderiza sempre os filhos e, depois deles, seu `content` enquanto `open`. O app é dono de `open` e do gatilho que o alterna (um dos filhos), e a aparência é do app: um `Collapsible` não tem gatilho, seta nem rótulo próprios. Com `reveal`, o conteúdo abre e fecha com movimento: a altura da sua região vai de zero até a do próprio conteúdo, com efeito de mola, e volta, e o que vem depois do collapsible se move junto.

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. O valor pertence ao app: o gatilho alterna `open`, e o collapsible mostra o valor que o app passa. Em Rust, `collapsible()` cria um com um setter por prop (`.open(..)`, `.reveal(..)`, `.content(..)`), os métodos de estilo tipados para a região e `.child(..)` para o que aparece sempre.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | Expandido: o `content` está na árvore, depois dos filhos. O app é dono do valor. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | Abre e fecha com uma revelação: o conteúdo fica em uma região que o recorta, e a altura dela vai de zero até a do próprio conteúdo, com efeito de mola, quando `open` é ativado, e volta quando é desativado, com amortecimento crítico (cerca de 265 ms, sem overshoot). O que vem depois do collapsible se move junto, e o conteúdo permanece na árvore até que a região tenha fechado. Com movimento reduzido, abre e fecha de imediato. A região fica no layout também quando fechada, com altura zero, então um `gap` do collapsible também vem antes dela. |
| `content` | `.content(..)` | `JSX.Element` | nenhum | O que expande. É criado uma vez e mantido enquanto recolhido, então o que está dentro preserva seu estado (o texto de um campo, a posição de rolagem, um switch) de uma abertura para a outra. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O que aparece em ambos os casos: um resumo, o gatilho que alterna `open`. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A região ao redor dos filhos e do conteúdo (`gap-2` os espaça). |

<a id="events"></a>

## Eventos

Um collapsible não reporta nada por conta própria: o gatilho é do app, e o seu toque (`onPress` do `View` com `role="button"`) é onde o app alterna `open`.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com |
|---|---|---|
| A região | | `class`, `style` |
| Os filhos | a região, primeiro | seus próprios elementos |
| A região da revelação | a região, depois dos filhos, com `reveal` | nenhum: ela recorta o conteúdo e assume a altura dele |
| O conteúdo | a região, depois dos filhos (na região da revelação com `reveal`), enquanto `open` | seus próprios elementos (`content`) |

Sem `reveal`, o conteúdo aparece e some de imediato, e cada plataforma refaz o layout da região quando ele chega ou sai. Com `reveal`, a mudança é uma animação de layout do commit que altera `open` (como `LayoutAnimation.configureNext`, executada nativamente, então nenhum JavaScript roda enquanto ela se move): a região da revelação cresce de zero até a altura do conteúdo e encolhe de volta, e os frames de tudo o que a mesma mudança move, entre eles as views depois do collapsible, se movem junto. Uma transição do app acompanha: a seta do gatilho gira (`transition-transform`), e o conteúdo pode surgir com um fade usando suas próprias classes.

<a id="accessibility"></a>

## Acessibilidade

- A região não é um elemento próprio para leitores de tela: seus filhos e seu conteúdo são lidos como são.
- O gatilho informa se a região está expandida: dê a ele `accessibilityState={{ expanded: open }}` e um papel de botão (`role="button"` em um `View`), e os leitores de tela anunciam "expandido" ou "recolhido" junto com o rótulo dele.
- No macOS e na web, o gatilho é uma parada do foco do teclado quando recebe toques: Tab chega até ele, e Espaço e Return alternam a região.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- Toda plataforma mostra o conteúdo depois dos filhos enquanto `open`, e o deixa fora do layout caso contrário.
- Com `reveal`, toda plataforma anima a altura da região com mola em seu próprio animador (iOS, Android, macOS, Windows, Linux, GPUI e a web), e a abre e fecha de imediato enquanto o sistema pede movimento reduzido.
- iOS, Android e Mac Catalyst: o toque no gatilho é um tap. Desktops (macOS, Windows, Linux, GPUI) e a web: um clique, e Espaço ou Return no gatilho focado no macOS e na web.
