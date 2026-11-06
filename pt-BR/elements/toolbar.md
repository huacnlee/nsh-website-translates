---
title: "Toolbar"
description: "Toolbar, ToolbarGroup e ToolbarSeparator: uma barra de botões, toggles e links que representa uma única parada do foco do teclado, cujas teclas de seta se movem ao longo dela, com grupos nomeados e separadores. A aparência e o estado de cada controle ficam a cargo do app."
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---


# Toolbar

Uma toolbar é uma barra de controles: a formatação de um editor de texto, os controles de transporte de um player de mídia, uma paleta vertical de ferramentas.
`Toolbar` cuida do teclado e da semântica de uma delas: leitores de tela anunciam uma toolbar (nomeada por seu
`accessibilityLabel`), e o teclado chega até ela em uma única parada e se move entre seus itens com as setas de seu
`axis`. Seus itens são os `Button`s, `Toggle`s e `Link`s dentro dela, em qualquer profundidade. Um `ToolbarGroup` é uma sequência nomeada de
itens relacionados (desfazer e refazer, o alinhamento), e um `ToolbarSeparator` é uma linha que o app desenha entre sequências. A aparência é
do app: a toolbar não tem cores, padding ou espaçamentos próprios, e cada controle mantém seu próprio estado.

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`, `ToolbarGroup` e `ToolbarSeparator` vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base`
em Rust. A toolbar não guarda valor: um toggle dentro dela é informado se está pressionado e reporta `onChange`, um
botão reporta `onPress`, e o app mantém o estado. Em Rust, `toolbar()`, `toolbar_group()` e
`toolbar_separator()` os criam, com um setter por prop (`.axis(..)`, `.disabled(..)`), os métodos de estilo tipados e
`.child(..)` para o conteúdo deles.

## Props

### Toolbar

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | A direção em que seus itens correm: as setas que se movem ao longo dela (Esquerda e Direita, ou Cima e Baixo) e a direção em que ela dispõe seus filhos (uma linha ou uma coluna). Lido quando a toolbar é criada. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Todos os itens da toolbar ficam desabilitados, seja qual for o `disabled` de cada um: sem pressionamentos, sem parada do foco do teclado, esmaecidos para leitores de tela. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam a toolbar ("Formatação"), para uma página com mais de uma. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os itens, seus grupos e separadores, e o que mais o app dispuser entre eles (um título, um espaçador, um input). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout e a aparência da barra: alinhamento, espaçamentos, padding, sua superfície. |

### ToolbarGroup

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Todos os itens do grupo ficam desabilitados, seja qual for o `disabled` de cada um. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o grupo ("Histórico", "Alinhamento"). |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os itens do grupo, e o que mais o app dispuser entre eles. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout e a aparência do grupo. Ele corre ao longo do eixo da toolbar. |

### ToolbarSeparator

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A linha: um traço fino atravessando uma linha (`h-5 w-px bg-border`) ou uma coluna (`h-px self-stretch bg-border`). |

<a id="items"></a>

## Itens

Os itens de uma toolbar são os `Button`s, `Toggle`s e `Link`s dentro dela, em seus grupos e também dentro de um
[`ToggleGroup`](./toggle.md) nela. O gatilho de um [`Menu`](./menu.md) ou de um [`Popover`](./popover.md) também é um
item: a view em seu slot `trigger`, à qual o popup dá seus pressionamentos, seu foco e seu estado `expanded`. Uma
ferramenta que o app desenha por conta própria é um `Button` com as classes do app: um `Button` não tem aparência própria, então fica como o app
o estiliza e é um item (um `View` com `onPress` continua sendo uma parada própria, fora das setas). Um
`ToggleGroup` dentro de uma toolbar é um de seus grupos: seus toggles são os itens da toolbar, leitores de tela anunciam um grupo,
e seu `disabled` ainda desabilita seus próprios toggles. Outros controles (um `Input`, um `Select`, um `Slider`) continuam sendo paradas
próprias e mantêm suas setas; coloque-os no fim da barra. O que um popup aberto por um item mostra (os
campos e botões de um popover, os itens de um menu, os links de um hover card) não faz parte da toolbar. As setas percorrem os itens na ordem em que a
barra os dispõe, por mais fundo que cada um esteja, e um item que o app mostra depois toma seu lugar entre eles.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| A barra | | `class`, `style` de `Toolbar` | |
| Um grupo | a barra | `class`, `style` de `ToolbarGroup` | |
| Um separador | a barra, um grupo | `class`, `style` de `ToolbarSeparator` | |
| Um item | a barra, um grupo | `class`, `style` do próprio item | os próprios: `aria-pressed:`, `disabled:`, `hover:`, `focus:`, `active:` |

Mostre o item em que o teclado está com estilos `focus:`, e um toggle pressionado por sua própria superfície (veja
[Guias de design](../docs/design-guides.md#interaction-states)).

## Vertical

Uma paleta de ferramentas é uma coluna: `axis="vertical"` dispõe os itens de cima para baixo, e as teclas Cima e Baixo se movem ao longo deles.

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

<a id="disabled"></a>

## Desabilitado

`disabled` em uma toolbar desabilita todos os itens nela, uma barra que o app trava; em um grupo, os itens do grupo. Um item desabilitado
não recebe pressionamentos, as setas o pulam, e leitores de tela o anunciam como esmaecido:

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## Acessibilidade

- `Toolbar` tem o papel `"toolbar"`, nomeado por `accessibilityLabel`; seus itens continuam sendo elementos próprios. No iOS, a
  toolbar é um grupo semântico no qual o VoiceOver entra.
- `ToolbarGroup` tem o papel `"group"`, nomeado por seu `accessibilityLabel`, de modo que uma sequência de itens é lida como uma unidade. Um
  `ToggleGroup` dentro de uma toolbar também é um grupo.
- `ToolbarSeparator` não é um elemento para leitores de tela.
- `disabled` é anunciado como a plataforma o anuncia (VoiceOver, TalkBack, UI Automation, a árvore de acessibilidade
  do navegador).

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="keyboard"></a>

## Teclado

No macOS e na web, onde Tab alcança as views que recebem pressionamentos, uma `Toolbar` segue o
[padrão de toolbar do WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Tecla | O que faz |
|---|---|
| Tab, Shift+Tab | Entra na toolbar no item em que o foco esteve por último (no início, o primeiro item que não está desabilitado), e sai dela em um único passo. |
| Seta para a direita, Seta para a esquerda (`axis="horizontal"`) | Move o foco para o item seguinte ou o anterior, do último ao primeiro e vice-versa. |
| Seta para baixo, Seta para cima (`axis="vertical"`) | Move o foco para o item seguinte ou o anterior, do último ao primeiro e vice-versa. |
| Home, End | Move o foco para o primeiro ou o último item. |
| Espaço, Return | Pressiona o item com foco. |

As setas pulam itens desabilitados e não pressionam nada: um toggle só muda quando é pressionado. O outro par de
setas fica para os itens (o gatilho de um menu abre seu menu com Seta para baixo). Em um layout da direita para a esquerda, uma toolbar
horizontal corre a partir da direita, então Seta para a esquerda move para o próximo item e Seta para a direita para o anterior; uma vertical mantém Seta para baixo e
Seta para cima.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: cada item é pressionado com um toque; a toolbar é um grupo que leitores de tela anunciam.
- Desktops (macOS, Windows, Linux, GPUI) e a web: um pressionamento é um clique. No macOS e na web a toolbar é uma única parada
  do Tab, e as setas, Home e End se movem entre seus itens ([Teclado](#keyboard)).
- Todas as plataformas desenham o que o app estiliza: a barra, seus grupos, seus separadores e seus itens.
