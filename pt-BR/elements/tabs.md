---
title: "Tabs"
description: "Tab e Tabs: as abas de uma lista de abas e a própria lista. Cada aba cuida de toques, ativação por teclado, estado desabilitado, além de seu papel e estado de seleção para leitores de tela; a lista é o conjunto, com um indicador que acompanha a aba selecionada de forma nativa; a aparência, o valor e o conteúdo exibido por cada aba ficam por conta do app."
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---


# Tabs

Abas alternam entre as seções de um mesmo lugar: a visão geral e a atividade de um projeto, as visualizações de um documento.
Cada `Tab` controla o comportamento de uma aba: pressionamentos, ativação por teclado, o estado desabilitado, e o papel de aba e seu estado selecionado para leitores de tela. Um `Tabs` ao redor delas é a lista de abas, que os leitores de tela anunciam como um só conjunto. A aparência é do app: uma aba não tem cores, tamanhos nem rótulo próprios. Seus filhos são o rótulo do app, e classes `selected:` na aba, ou classes `group-selected:` no que está dentro dela, acompanham seu estado. O conteúdo de cada seção também é do app: mostra aquela que o seu valor nomeia, ao lado da lista. O indicador da lista, um sublinhado ou uma pílula que o app estiliza, fica na aba selecionada e viaja até a próxima de forma nativa ([Indicador](#indicator)).

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

`Tab` e `Tabs` vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. O valor é do app: a lista não guarda nenhum. Cada aba é informada se está selecionada; um pressionamento reporta `onPress`, o app define seu valor e mostra aquela seção, e cada aba mostra o `selected` que o app devolve. Os cantos da lista e os das abas são concêntricos: o padding da lista (`p-1`) é a diferença entre `radius.lg` e `radius`. O preenchimento da aba selecionada é o indicador da lista (`indicatorClass`, dentro desse padding: `inset-y-1`), que se move com efeito de mola até a aba que o app seleciona. Em Rust, `tab()` e `tabs()` os criam, com um setter por prop (`.selected(..)`), um listener por evento (`.on_press(..)`), os métodos de estilo tipados e `.child(..)` para o conteúdo deles.

## Props

### Tab

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | A aba atual da sua lista: os leitores de tela dizem que ela está selecionada, e os estilos `selected:` se aplicam. Um pressionamento reporta `onPress`; a aba mostra o valor que o app devolve. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem pressionamentos e sem feedback de pressão; os estilos `disabled:` se aplicam, e os leitores de tela dizem que ela está esmaecida. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo da aba enquanto selecionada e não desabilitada, como classes `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem: o nome da aba, quando seus filhos não têm texto que o diga (um ícone). |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O rótulo, ícone ou badge do app, que os leitores de tela dizem. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A própria aba: a superfície ao redor do seu rótulo. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo da aba enquanto pressionada, com hover, com foco ou desabilitada, como as classes `<state>:`. |

### Tabs

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | nenhum | As classes Tailwind do indicador na aba selecionada: sua aparência e seu lugar na largura da lista (`bottom-0 h-0.5` para um sublinhado em uma linha, `inset-y-1` para uma pílula). Ao longo da lista, ele abrange a aba selecionada, dentro de suas próprias margens nesse eixo. Com `indicatorClass` ou `indicatorStyle`, a lista tem um indicador. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do indicador, sobre `indicatorClass`. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | As abas da lista, e o que mais o app dispuser entre elas. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout e a aparência da lista: uma coluna por padrão, `flex-row` para uma linha. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onPress` (`Tab`) | `.on_press(\|_: &()\| ..)` | A aba foi pressionada: um toque, um clique, Espaço ou Return enquanto ela tem o foco do teclado, ou a ativação por um leitor de tela; ou uma tecla de seta, Home ou End da sua lista moveu o foco do teclado para ela. Roda antes que qualquer coisa mude: a aba mostra o `selected` que o app devolve. |

A aba selecionada também reporta seus pressionamentos, para que o app possa agir diante de um segundo pressionamento (rolar a seção até o topo, por exemplo).
Uma aba desabilitada não reporta nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| A lista | | `Tabs` `class`, `style` | |
| O indicador | a lista, atrás das abas | `indicatorClass`, `indicatorStyle` | na aba selecionada |
| A aba | a lista | `Tab` `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `selectedStyle`, `disabledStyle`, ...) |
| O rótulo | a aba | seus próprios elementos (`children`) | `group-selected:`, `group-disabled:` e as outras variantes `group-*:` com `group` no `class` da aba |
| O conteúdo da seção | ao lado da lista | os elementos do app | o valor do app |

Mostre a aba selecionada por meio da sua própria superfície: um preenchimento, um rótulo mais forte, um peso mais pesado (veja
[Guias de design](../docs/design-guides.md#interaction-states)).

<a id="indicator"></a>

## Indicador

Um sublinhado sob a aba selecionada, uma pílula atrás dela ou o segmento elevado de um controle segmentado é o
indicador da lista: uma view que o app estiliza com `indicatorClass` e `indicatorStyle`, desenhada atrás das abas e posicionada de forma absoluta na lista. O Native Shell o coloca na aba selecionada após cada layout. Ao longo da lista (a largura de uma linha, a altura de uma coluna), ele abrange essa aba, dentro das margens do próprio indicador nesse eixo (`mx-3` para um sublinhado mais curto que sua aba); na direção transversal à lista, suas classes o posicionam:

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

Quando o app seleciona outra aba, o indicador se move até lá com efeito de mola, de forma nativa, como o indicador da tab bar do GPUI Kit; com movimento reduzido, ele se move de imediato. Enquanto nenhuma aba está selecionada, ele fica oculto; enquanto várias estão, ele fica na primeira. Um redimensionamento ou uma mudança na largura de uma aba o move no mesmo frame que as abas. O indicador não precisa de eventos de layout nem de código do app: a aba selecionada é aquela cujo `selected` é verdadeiro. Em uma lista que rola, a view de rolagem envolve o `Tabs`, e o indicador rola junto com as abas.

<a id="disabled"></a>

## Desabilitado

Uma aba desabilitada não aceita pressionamentos, e os leitores de tela a anunciam como esmaecida. Suas classes `disabled:` se aplicam sobre as `selected:`, e as classes `group-disabled:` dentro dela acompanham:

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

<a id="accessibility"></a>

## Acessibilidade

- Uma aba é um único elemento para leitores de tela, com o papel `"tab"` e seu estado selecionado. Seu rótulo é o texto dos seus filhos, ou `accessibilityLabel`.
- `Tabs` tem o papel `"tablist"`: os leitores de tela ouvem as abas dentro dele como um só conjunto, cada uma ainda sendo um elemento próprio.
- `disabled` é anunciado como a plataforma o anuncia (VoiceOver, TalkBack, UI Automation, a árvore de acessibilidade do navegador).
- No macOS e na web, a lista é uma única parada do foco do teclado, e as teclas de seta se movem entre suas abas (abaixo).
- O indicador fica oculto para leitores de tela e não recebe foco: apenas as abas são os elementos da lista.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="keyboard"></a>

## Teclado

No macOS e na web, onde Tab alcança as views que aceitam pressionamentos, uma lista `Tabs` segue o
[padrão de tabs do WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):

| Tecla | O que faz |
|---|---|
| Tab, Shift+Tab | Entra na lista pela aba selecionada (a primeira aba que não está desabilitada, enquanto nenhuma estiver), e sai dela em um único passo. |
| Direita, Baixo | Move o foco para a próxima aba, da última para a primeira. |
| Esquerda, Cima | Move o foco para a aba anterior, da primeira para a última. |
| Home, End | Move o foco para a primeira ou a última aba. |
| Espaço, Return | Pressiona a aba com foco. |

As teclas de seta pulam as abas desabilitadas, e a aba para a qual elas movem reporta `onPress`, de modo que o app a seleciona conforme o foco se move: a seção acompanha o foco. Os dois pares de setas movem o foco, seja qual for o layout da lista, que é uma classe do app. Em um layout da direita para a esquerda, a linha corre a partir da direita, então Esquerda e Direita trocam de lugar: Esquerda move para a próxima aba e Direita para a anterior; Cima, Baixo, Home e End mantêm o seu comportamento. Os estilos `focus:` mostram onde está o foco. Um `Tab` fora de um `Tabs` é uma parada própria.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: um pressionamento é um toque que termina na aba, incluindo seu rótulo.
- Desktops (macOS, Windows, Linux, GPUI) e a web: um pressionamento é um clique. No macOS e na web, Espaço e Return também pressionam a aba que tem o foco do teclado, e as teclas de seta, Home e End o movem ([Teclado](#keyboard)).
- Todas as plataformas desenham o que o app estiliza: as abas, a superfície da selecionada, o indicador e o conteúdo das seções. O deslocamento do indicador é uma animação de layout nativa em todas as plataformas.
