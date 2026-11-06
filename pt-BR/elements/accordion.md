---
title: "Accordion"
description: "Accordion e suas partes: seções empilhadas que se expandem e se recolhem sob seus títulos, uma por vez ou várias, abertas pelo valor do app, reveladas por uma altura com efeito de mola quando solicitado, com toda a aparência definida pelo app."
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---


# Accordion

Um accordion empilha seções que se expandem e se recolhem sob seus títulos: as perguntas de um FAQ, os grupos de uma página de configurações, as etapas de um checkout. Cinco partes o compõem, cada uma responsável por um pedaço do comportamento e nenhuma pela aparência:

- `Accordion`, a pilha: guarda os `value` do app, os valores dos itens abertos, e informa o próximo com
  `onChange`. Um item abre por vez, ou vários com `multiple`.
- `AccordionItem`, uma seção, identificada por seu `value`. Fica aberta enquanto o `value` do accordion a contiver.
- `AccordionHeader`, o título do item, de um `level` que os leitores de tela anunciam.
- `AccordionTrigger`, o botão no título que expande e recolhe seu item, e informa se está expandido.
- `AccordionPanel`, o conteúdo do item, exibido enquanto ele está aberto; com `reveal`, sua altura se abre e se fecha como uma mola.

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

As partes vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. O valor pertence ao app: o toque em um
trigger informa o próximo `value` com `onChange`, e o accordion abre os itens cujos valores o app devolve.
Cada parte encontra sozinha a que a envolve, então o app as organiza livremente: divisores entre os itens, um badge
em um título, um ícone antes de um título de texto. Em Rust, `accordion()`, `accordion_item()`, `accordion_header()`,
`accordion_trigger()` e `accordion_panel()` as criam, com um setter por prop e `.child(..)` para o que fica dentro.

## Props

### Accordion

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | Os `value`s dos itens abertos. O app é o dono deles: o toque em um trigger informa os próximos com `onChange`, e o accordion mostra os que o app devolve. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Vários itens abertos ao mesmo tempo: abrir um deixa os outros abertos. Sem isso, abrir um item fecha o que estava aberto. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Todos os itens ficam desabilitados: nenhum trigger recebe toques, e os leitores de tela informam que cada um está esmaecido. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os itens, e o que o app dispuser entre eles (divisores). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout e a aparência da pilha: um cartão em volta dos itens, o espaço entre eles. |

### AccordionItem

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | obrigatório | O que identifica o item no `value` do accordion: o id do próprio app, nunca o título, que muda com o idioma. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Seu trigger não recebe toques, e os leitores de tela informam que está esmaecido. O item continua aberto ou fechado conforme o `value` do accordion. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O header e o panel do item, e o que mais o app dispuser dentro dele. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A seção: um divisor abaixo dela, um cartão em volta. |

### AccordionHeader

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | O nível do título entre os títulos da página, para os leitores de tela (1 é o mais alto). |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O trigger do item, e o que mais o header contiver (um badge, uma ação própria). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout do título. |

### AccordionTrigger

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do trigger enquanto seu item está aberto, como classes `aria-expanded:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem, quando os filhos não têm texto que o diga. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O título e o chevron; as classes `group-aria-expanded:` dentro dele acompanham o trigger com `group` em seu `class`. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio trigger: a linha que o usuário pressiona. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do trigger enquanto pressionado, com o ponteiro sobre ele, com foco ou desabilitado, como as classes `<state>:`. |

### AccordionPanel

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | Abre e fecha com uma revelação, como a de `Collapsible`: o panel recorta seu conteúdo e sua altura vai de zero até a do conteúdo e volta, como uma mola criticamente amortecida (cerca de 265 ms, sem overshoot), e os itens seguintes se movem junto. Com movimento reduzido, abre e fecha de uma vez. |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | O conteúdo permanece na árvore enquanto o item está fechado, fora da vista, do foco do teclado e dos leitores de tela: um vídeo mantém sua posição, uma web view mantém sua página. Sem isso, o conteúdo sai da árvore quando o panel fecha (depois que a revelação o fechou) e volta como estava. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam a região: em geral o título do item, como diz o seu header. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout e a aparência da região. Com `reveal`, o panel fica no layout enquanto fechado, com altura zero, então seu padding e suas bordas vão em uma view do conteúdo. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | Um trigger foi pressionado: um toque, um clique, Space ou Return enquanto ele tem o foco do teclado, ou a ativação por um leitor de tela. `value` são os valores dos itens abertos como ficariam: o valor de um item aberto sai da lista, o de um fechado entra no fim dela ou, sem `multiple`, a substitui. Roda antes de qualquer mudança: defina `value` para acompanhá-lo. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| A pilha | | `Accordion` de `class`, `style` | |
| Um item | a pilha | `AccordionItem` de `class`, `style` | o valor do app |
| O título | o item | `AccordionHeader` de `class`, `style` | |
| O trigger | o título | `AccordionTrigger` de `class`, `style` | `aria-expanded:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `expandedStyle`, `disabledStyle`, ...) |
| O título de texto e o chevron | o trigger | seus próprios elementos (`children`) | `group-aria-expanded:`, `group-disabled:` com `group` no `class` do trigger |
| O panel | o item, depois do título | `AccordionPanel` de `class`, `style` | |
| O conteúdo | o panel | seus próprios elementos (`children`) | |

Sem `reveal`, um panel fechado fica fora do layout e seu conteúdo fora da árvore. Com `reveal`, a mudança é uma
animação de layout do commit que altera `value` (como `LayoutAnimation.configureNext`, executada nativamente, então nenhum
JavaScript roda enquanto ela se move): o panel que abre cresce de zero até a altura de seu conteúdo, o que fecha encolhe
de volta, ambos na mesma mola, e os itens seguintes se movem junto. Uma transição do app acompanha: o
chevron gira (`transition-transform group-aria-expanded:rotate-180`).

<a id="disabled"></a>

## Desabilitado

O trigger de um item desabilitado não recebe toques, e os leitores de tela o anunciam como esmaecido; as classes `disabled:` no
trigger e `group-disabled:` dentro dele acompanham. O `disabled` do accordion desabilita todos os itens. Um item desabilitado ainda
mostra o que o `value` do app diz: o app pode abri-lo.

<a id="accessibility"></a>

## Acessibilidade

- A pilha é um grupo, cada header é um título de seu `level`, e cada trigger é um botão dentro dele que informa se
  seu item está expandido. Os leitores de tela podem ir de título em título.
- Um panel aberto é uma região, nomeada por seu `accessibilityLabel`; um fechado fica oculto dos leitores de tela, inclusive o
  conteúdo mantido.
- A aparência do item aberto é do app, e não deve depender só da cor: gire o chevron, como fazem os exemplos.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="keyboard"></a>

## Teclado

Onde as views que recebem toques são paradas do foco do teclado (macOS e a web), cada trigger é uma parada, na
ordem da página, e Space e Return o pressionam. Os triggers desabilitados são pulados, assim como o conteúdo de um panel
fechado. Tab vai de um trigger para os controles de seu panel aberto e segue para o próximo trigger.

<a id="platform-notes"></a>

## Notas por plataforma

- Todas as plataformas mostram o panel de um item aberto sob seu título e deixam um fechado fora do layout (altura zero
  com `reveal`).
- Com `reveal`, todas as plataformas animam como mola a altura dos panels em seu próprio animador (iOS, Android, macOS, Windows, Linux,
  GPUI e a web), e os abrem e fecham de uma vez enquanto o sistema pede movimento reduzido.
- O leitor de tela de cada plataforma ouve o título e seu nível ao ler os títulos, e o trigger dentro dele como
  um botão com seu estado expandido; no iOS, o VoiceOver lê o próprio trigger.
- iOS, Android e Mac Catalyst: o acionamento de um trigger é um toque. Desktops (macOS, Windows, Linux, GPUI) e a web: um
  clique, e Space ou Return no trigger com foco no macOS e na web.
