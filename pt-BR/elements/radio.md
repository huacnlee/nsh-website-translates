---
title: "Radio"
description: "Radio e RadioGroup: um conjunto de opções das quais o usuário escolhe exatamente uma. Cada radio gerencia os toques, a ativação por teclado, o estado desabilitado e seu papel e estado marcado para leitores de tela; o grupo é o conjunto; a aparência e o valor ficam por conta do app."
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---


# Radio

Radios oferecem um conjunto de opções das quais o usuário escolhe exatamente uma: um plano, uma ordem de classificação, um tema. Cada `Radio` é responsável pelo comportamento de uma opção: pressionamentos, ativação por teclado, o estado desabilitado, e o papel de radio e seu estado marcado para leitores de tela. Um `RadioGroup` em volta deles é o conjunto, que os leitores de tela anunciam como um só grupo. A aparência é do app: um radio não tem círculo, ponto, cores, tamanhos nem rótulo próprios. Seus filhos são o indicador e o rótulo do app, e classes `checked:` no radio, ou classes `group-checked:` no que está dentro dele, acompanham seu estado.

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio` e `RadioGroup` vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` do Rust. O valor é do app: o grupo não guarda nenhum. Cada radio é informado se está marcado; um pressionamento em um radio desmarcado reporta `onChange({ checked: true })`, o app define seu valor, e cada radio mostra o `checked` que o app devolve. Em Rust, `radio()` e `radio_group()` os criam, com um setter por prop (`.checked(..)`), um listener por evento (`.on_change(..)`), os métodos de estilo tipados e `.child(..)` para o conteúdo.

## Props

### Radio

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Marcado ou não. Um pressionamento em um radio desmarcado reporta `true` com `onChange`; o radio mostra o valor que o app devolve. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem pressionamentos e sem feedback de pressionamento; os estilos `disabled:` se aplicam, e os leitores de tela dizem que está esmaecido. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do radio enquanto marcado e não desabilitado, como classes `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem: a opção, quando seus filhos não têm texto que a diga. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nenhum | A distância, fora dos limites do radio, em que os pressionamentos ainda contam, em pontos: um número para todos os lados, ou os lados nomeados. Como o `hitSlop` de uma view. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O indicador e o rótulo do app, que os leitores de tela dizem. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio radio: a linha em torno do indicador e do rótulo. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do radio enquanto pressionado, com hover, com foco ou desabilitado, como as classes `<state>:`. |

### RadioGroup

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os radios do conjunto, e o que o app dispuser entre eles. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout e a aparência do grupo: uma coluna por padrão, `flex-row` para uma linha. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | Um radio desmarcado foi pressionado: um toque, um clique, Space ou Return enquanto ele tem o foco do teclado, ou a ativação por um leitor de tela; ou uma tecla de seta do seu grupo moveu o foco do teclado para ele. Ele pede para ser marcado, então `checked` é `true`. Executa antes de qualquer mudança: o radio mostra o `checked` que o app devolve. |

Um radio marcado continua marcado e não reporta nada, pois um radio não pode se desmarcar sozinho; um radio desabilitado também não reporta nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| O grupo | | `class`, `style` de `RadioGroup` | |
| O radio | o grupo | `class`, `style` de `Radio` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `checkedStyle`, `disabledStyle`, ...) |
| O indicador e o rótulo | o radio | seus próprios elementos (`children`) | `group-checked:`, `group-disabled:` e as outras variantes `group-*:` com `group` no `class` do radio |

O indicador é o conteúdo do app: um anel com um ponto, um check, um card destacado. Com `group` no `class` do radio, suas classes `group-checked:` mostram o ponto enquanto o radio está marcado.

<a id="disabled"></a>

## Desabilitado

Um radio desabilitado não recebe pressionamentos, e os leitores de tela o anunciam como esmaecido. Suas classes `disabled:` se aplicam sobre as `checked:`, e as classes `group-disabled:` dentro dele acompanham:

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

<a id="a-small-target-with-hitslop"></a>

## Um alvo pequeno com hitSlop

Um radio sem rótulo ao lado (um ponto na linha de uma tabela) pode ser menor que um dedo. `hitSlop` faz com que os pressionamentos que caem perto dele contem, em pontos além de cada lado, sem mudar seu layout nem sua aparência: um número para todos os lados, ou os lados nomeados (`{ top: 8, bottom: 8 }`), como o [`hitSlop` de uma view](./index.md#presses-and-feedback) os recebe.

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

<a id="accessibility"></a>

## Acessibilidade

- Um radio é um único elemento para os leitores de tela, com o papel `"radio"` e seu estado: marcado ou não, e selecionado enquanto marcado, pois alguns leitores de tela leem um e outros leem o outro (os radios do UI Automation são itens de seleção). Seu indicador e seu rótulo são partes dele; seu rótulo é o texto de seus filhos, ou `accessibilityLabel`.
- Um `RadioGroup` tem o papel `"radiogroup"`: os leitores de tela ouvem os radios dentro dele como um só conjunto, cada um ainda sendo um elemento próprio.
- `disabled` é anunciado como a plataforma o anuncia (VoiceOver, TalkBack, UI Automation, a árvore de acessibilidade do navegador).
- No macOS e na web, um `RadioGroup` é uma única parada do foco do teclado, e as teclas de seta se movem entre seus radios e os marcam (abaixo).

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="keyboard"></a>

## Teclado

No macOS e na web, onde Tab alcança as views que recebem pressionamentos, um `RadioGroup` segue o [padrão de radio group do WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/radio/):

| Tecla | O que faz |
|---|---|
| Tab, Shift+Tab | Entra no grupo pelo radio marcado (o primeiro radio não desabilitado, enquanto nenhum estiver marcado), e sai dele em um só passo. |
| Down, Right | Move o foco para o próximo radio, do último para o primeiro, e o marca. |
| Up, Left | Move o foco para o radio anterior, do primeiro para o último, e o marca. |
| Space | Marca o radio com foco. |

As teclas de seta pulam os radios desabilitados; o radio para o qual elas movem pede para ser marcado com `onChange`, e o app o marca. Em um layout da direita para a esquerda, Left e Right trocam de lugar: Left move para o próximo radio e Right para o anterior; Up e Down mantêm os seus. Os estilos `focus:` mostram onde está o foco. Um `Radio` fora de um `RadioGroup` é uma parada própria, que Tab alcança e que Space e Return marcam.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: um pressionamento é um toque que termina no radio, incluindo seu rótulo.
- Desktops (macOS, Windows, Linux, GPUI) e web: um pressionamento é um clique. No macOS e na web, Space e Return também marcam o radio que tem o foco do teclado, e as teclas de seta o movem ([Teclado](#keyboard)).
- Todas as plataformas desenham o que o app estiliza: o indicador, o rótulo e suas transições.
