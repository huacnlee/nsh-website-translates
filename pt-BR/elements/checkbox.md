---
title: "Checkbox"
description: "O componente Checkbox: um controle marcado, desmarcado ou indeterminado que gerencia toques, ativação por teclado, o estado desabilitado e sua função e valor para leitores de tela, com um indicador que o app estiliza e marca."
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---


# Checkbox

Um checkbox seleciona uma opção, um item de uma lista ou todos eles. Ele está marcado, desmarcado ou indeterminado (nem um nem outro: um "selecionar tudo" sobre uma seleção parcial). Ele é responsável pelo comportamento: pressionamentos, ativação pelo teclado, o estado desabilitado, e o papel de checkbox e seu valor para leitores de tela. A aparência é do app: um `Checkbox` não tem caixa, marca, cores, tamanhos nem rótulo próprios. Ele é composto por um indicador (a caixa) com a marca do app dentro, depois seus filhos (um rótulo), e o app estiliza cada parte, com classes `checked:`, `indeterminate:` e `disabled:` que acompanham o checkbox.

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. O valor é do app: um pressionamento informa o próximo valor com `onChange`, e o checkbox exibe o `checked` e o `indeterminate` que o app devolve. Em Rust, `checkbox()` cria um, com um setter por prop (`.checked(..)`, `.indicator_style(..)`), um listener por evento (`.on_change(..)`), os métodos de estilo tipados para o próprio checkbox e `.child(..)` para seu rótulo; o estilo do indicador recebe os métodos de estado (`.checked(..)`, `.indeterminate(..)`, `.disabled_style(..)`) que acompanham o checkbox.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Marcado ou não. Um pressionamento informa o próximo valor com `onChange`; o checkbox exibe o valor que o app devolve. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | Nem marcado nem desmarcado, sobrepondo `checked` enquanto estiver ativo: leitores de tela dizem que está misto, e um pressionamento pede marcado. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem pressionamentos e sem feedback de pressionamento; os estilos `disabled:` se aplicam ao checkbox e ao seu indicador, e leitores de tela dizem que está esmaecido. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do checkbox enquanto está marcado e não desabilitado, como classes `checked:`. |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do checkbox enquanto está indeterminado e não desabilitado, como classes `indeterminate:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem: o que o checkbox seleciona, quando seus filhos não têm texto que o diga. |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | O que ele é para os leitores de tela, quando é algo mais específico (um item de menu marcado: `"menuitem"`). |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O indicador, a caixa que mostra o valor. |
| `indicator` | `.indicator(..)` | `JSX.Element` | nenhum | O conteúdo do indicador: a marca (um check, um traço), que o app exibe conforme o valor. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nenhum | Até onde, fora de seus limites, os pressionamentos ainda contam, em pontos: um número para todos os lados, ou os lados nomeados. Como o `hitSlop` de uma view. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo depois do indicador: um rótulo, que os leitores de tela leem. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio checkbox: a linha em torno do indicador e do rótulo. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do checkbox enquanto está pressionado, com hover, com foco ou desabilitado, como as classes `<state>:`. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | O checkbox foi pressionado: um toque, um clique, Space ou Return enquanto ele tem o foco do teclado, ou uma ativação por leitor de tela. Informa o valor que o checkbox pede como `checked`: `true` a partir de desmarcado e de indeterminado, `false` a partir de marcado. |

Um checkbox desabilitado não informa nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| O checkbox | | `class`, `style` | `checked:`, `indeterminate:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `checkedStyle`, `indeterminateStyle`, `disabledStyle`, ...) |
| O indicador | o checkbox, primeiro | `indicatorClass`, `indicatorStyle` | `checked:`, `indeterminate:`, `disabled:` acompanham o checkbox |
| A marca | o indicador | seus próprios elementos (`indicator`) | `group-checked:`, `group-indeterminate:` e as outras variantes `group-*:` com `group` em `indicatorClass` |
| O rótulo | o checkbox, depois do indicador | seus próprios elementos (`children`) | variantes `group-*:` com `group` no `class` do checkbox |

A marca é conteúdo do app, então ela mostra o que o app decidir: um check enquanto marcado e um traço enquanto indeterminado, escolhidos a partir do valor que o app mantém, ou as duas marcas, com classes `group-checked:` / `group-indeterminate:` escolhendo a que aparece.

<a id="indeterminate"></a>

## Indeterminado

Um checkbox "selecionar tudo" fica indeterminado enquanto alguns itens estão selecionados. Um pressionamento pede marcado, e o app seleciona todos os itens:

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

<a id="disabled"></a>

## Desabilitado

Um checkbox desabilitado não recebe pressionamentos, e os leitores de tela o anunciam como esmaecido. Suas classes `disabled:` e as do seu indicador se aplicam, sobrepondo as `checked:` e `indeterminate:`:

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

<a id="a-small-target-with-hitslop"></a>

## Um alvo pequeno com hitSlop

Um checkbox sem rótulo ao lado (a caixa de seleção de uma linha) pode ser menor que um dedo. `hitSlop` faz com que pressionamentos que caiam perto dele contem, em pontos além de cada lado, sem alterar seu layout nem sua aparência: um número para todos os lados, ou os lados nomeados (`{ top: 8, bottom: 8 }`), como o `hitSlop` de uma [view](./index.md#presses-and-feedback) os recebe.

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## Acessibilidade

- Um checkbox é um único elemento para leitores de tela, com o papel `"checkbox"` (ou seu `role`) e seu valor: marcado, desmarcado ou misto enquanto indeterminado. O indicador e a marca são partes dele. Seu rótulo é o texto de seus filhos; informe `accessibilityLabel` quando não houver nenhum.
- `disabled` é anunciado como a plataforma o anuncia (VoiceOver, TalkBack, UI Automation, a árvore de acessibilidade do navegador).
- No macOS e na web, um checkbox é uma parada do foco do teclado: Tab chega até ele, Space e Return o alternam, e os estilos `focus:` mostram onde está o foco.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: um pressionamento é um toque que termina no checkbox, incluindo seu rótulo.
- Desktops (macOS, Windows, Linux, GPUI) e a web: um pressionamento é um clique. No macOS e na web, Space e Return também alternam o checkbox que tem o foco do teclado.
- Todas as plataformas desenham o que o app estiliza: o indicador, a marca e suas transições.
