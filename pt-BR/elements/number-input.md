---
title: "NumberInput"
description: "O componente NumberInput: um número digitado em um campo ou incrementado com botões, as teclas de seta e leitores de tela, mantido dentro das casas decimais do seu step e dos valores min e max, com um campo, botões e uma coluna de controles que o app estiliza."
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---


# NumberInput

Um input numérico guarda um número que o usuário digita ou incrementa: uma quantidade, um preço, um tamanho. Ele é dono do seu comportamento: seu campo aceita um número, ou o texto a caminho de um (`-`, `1.`), e recusa todo o resto, inclusive dígitos e sinais de outros teclados; seus botões, as teclas Seta para cima e Seta para baixo e as ações de incremento e decremento de um leitor de tela mudam o número em `step`, mantendo suas casas decimais, e param em `min` e `max`; ao sair do campo, um número digitado é limitado a eles. A aparência é do app: um `NumberInput` não tem cores, tamanhos, bordas, ícones nem textos próprios. Ele é feito do botão de decremento, do campo entre o `prefix` e o `suffix` do app, e do botão de incremento (ou do campo entre eles e uma coluna com os dois botões, `controlsRight`), e o app estiliza cada parte e preenche os botões.

```rust tabs
use nsh_base::{number_input, theme};
use nsh_core::prelude::*;

fn tickets(count: Signal<Option<f64>>) -> impl IntoElement {
    number_input()
        .value(move || count.get())
        .min(1.0)
        .max(10.0)
        .accessibility_label("Tickets")
        .on_change(move |next: &Option<f64>| count.set(*next))
        .h(px(32.0))
        .flex_row()
        .rounded(px(8.0))
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_center().text_color(move || theme().foreground))
        .decrement_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .increment_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .decrement_button(text("−"))
        .increment_button(text("+"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { NumberInput } from "nsh/base";

function App() {
  const tickets = signal<number | null>(2);
  return (
    <NumberInput
      value={tickets()}
      onChange={({ value }) => tickets.set(value)}
      min={1}
      max={10}
      accessibilityLabel="Tickets"
      class="h-8 flex-row overflow-hidden rounded-lg border border-input bg-field focus-within:outline-2 focus-within:outline-ring"
      inputClass="flex-1 text-center text-foreground"
      decrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      incrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      decrementButton={<Text>−</Text>}
      incrementButton={<Text>+</Text>}
    />
  );
}

mount(App);
```

`NumberInput` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `number_input()` cria um com um setter por prop (`.value(..)`, `.input_style(..)`), um método de listener por evento (`.on_change(..)`), os métodos de estilo tipados para o próprio input, e `.prefix(..)` / `.suffix(..)` para o que fica ao redor do campo. Seu valor é um `Option<f64>`.

<a id="value"></a>

## Valor

O valor é um número, ou `null` para um campo vazio. O app é dono dele com `value` e define o que `onChange` informa, como em todo controle de `nsh/base`; ou deixa o valor com o input usando `defaultValue`, e ouve as mudanças do mesmo jeito.

O texto do campo e o valor são mantidos separados onde precisam ser, para que o usuário possa digitar livremente:

- `onChange` informa o número que o texto representa sempre que esse número muda: `null` enquanto o texto não representa nenhum (vazio, `-`, `.`); digitar `1.` depois de `1`, ou `1.50` depois de `1.5`, não informa nada.
- O texto permanece como o usuário o digita enquanto representa o valor que o input mantém, de modo que um input controlado que devolve cada valor informado mantém `1.` e `2.50`. Um valor definido pelo app que o input não informou aparece no campo, como o texto mais curto que o representa (`0.3`, `12`).
- Ao digitar, um número pode ficar fora de `min` e `max` (1 a caminho de 15 com `min={10}`), e é informado como digitado. Quando o campo é deixado, ou ao pressionar Return / Enter, ele é limitado ao intervalo e isso é informado; um texto que não representa nenhum número permanece como está.
- Um passo (um botão, uma tecla, uma ação de leitor de tela) pede o próximo valor com `onChange`; com um valor controlado, o campo se move quando o app o devolve, mantendo as casas decimais do passo (`99.5` até `max={100}` mostra `100.0`), de modo que um app que recusa um passo mantém o campo onde está. Uma edição que o app recusa permanece no campo enquanto ele está em edição, e some quando o campo é deixado.

```tsx
const price = signal<number | null>(19.95);

<NumberInput
  value={price()}
  onChange={({ value }) => price.set(value)}
  onSubmit={({ value }) => save(value)}
  min={0}
  step={0.05}
  placeholder="Price"
  accessibilityLabel="Price"
/>;
```

O campo aceita:

- Dígitos, um ponto decimal e um sinal no início (`+` ou `-`); uma letra, um segundo ponto ou sinal, ou um sinal em outra posição é recusado, e o campo volta ao seu texto.
- Dígitos, sinais e ponto de largura total, o sinal de menos (U+2212) e o ponto final ideográfico (`。`), lidos como suas formas ASCII, como os métodos de entrada de chinês e japonês os digitam.
- Uma vírgula como ponto decimal enquanto o texto não tem ponto (`3,25` é 3.25), como a tecla decimal dos teclados de muitos idiomas a digita.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | nenhum | O valor (controlado): um número, ou `null` para um campo vazio. O app define o que `onChange` informa. |
| `defaultValue` | `.default_value(..)` | `number \| null` | nenhum | O valor inicial enquanto `value` não está definido; o input então mantém o seu próprio. |
| `min` | `.min(..)` | `number` | nenhum | O menor valor: os passos param nele, e um valor digitado abaixo dele é limitado a ele quando o campo é deixado. |
| `max` | `.max(..)` | `number` | nenhum | O maior valor, como `min` por cima; um valor abaixo de `min` é `min`. |
| `step` | `.step(..)` | `number` | `1` | Quanto um passo avança (Page Up / Page Down: dez passos); um valor que não seja um número positivo é `1`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem digitação, passos nem foco; as classes `disabled:` se aplicam ao input e às suas partes. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | O texto pode ser selecionado e copiado, mas não alterado, nem por digitação nem por passos; os botões ficam desabilitados. |
| `placeholder` | `.placeholder(..)` | `string` | nenhum | Exibido enquanto o campo está vazio. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para o campo, quando nenhum rótulo visível o nomeia. |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | Os dois botões em uma coluna à direita do campo, o de incremento acima do de decremento. Lido quando o input é criado. |
| `inputClass`, `inputStyle` | `.input_style(\|s\| ..)` | `string`, `StyleProp<InputStyle>` | nenhum | O campo: sua caixa e seu texto (`color`, `fontSize`, `textAlign`, `placeholderColor`, `caretColor`). |
| `decrementButtonClass`, `decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O botão de decremento. |
| `incrementButtonClass`, `incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O botão de incremento. |
| `decrementButton`, `incrementButton` | `.decrement_button(..)`, `.increment_button(..)` | `JSX.Element` | nenhum | O conteúdo dos botões: um sinal, um ícone. |
| `controlsClass`, `controlsStyle` | `.controls_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A coluna que contém os dois botões com `controlsRight`. |
| `prefix` | `.prefix(..)` | `JSX.Element` | nenhum | O que vem antes do campo, depois do botão à sua esquerda: um símbolo de moeda, um ícone. |
| `suffix` | `.suffix(..)` | `JSX.Element` | nenhum | O que vem depois do campo, antes dos botões à direita: uma unidade, uma moeda. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio input: a linha ao redor do campo e dos botões. |

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | O número que o campo representa mudou (digitação, um passo, o incremento ou decremento de um leitor de tela, o campo deixado com um valor fora do intervalo). |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Return / Enter no campo: o valor, limitado a `min` e `max`. |
| `onFocus` | `.on_focus(..)` | nenhum | O campo recebeu o foco do teclado. |
| `onBlur` | `.on_blur(..)` | nenhum | O campo perdeu o foco do teclado (antes, seu valor é limitado a `min` e `max`). |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com |
|---|---|---|
| O input | | `class`, `style` |
| O botão de decremento | o input, primeiro (com `controlsRight`: a coluna de controles, em segundo) | `decrementButtonClass`, `decrementButtonStyle`; seu conteúdo `decrementButton` |
| O campo | o input | `inputClass`, `inputStyle` |
| O prefixo | o input, antes do campo | seus próprios elementos (`prefix`) |
| O sufixo | o input, depois do campo | seus próprios elementos (`suffix`) |
| O botão de incremento | o input, por último (com `controlsRight`: a coluna de controles, em primeiro) | `incrementButtonClass`, `incrementButtonStyle`; seu conteúdo `incrementButton` |
| A coluna de controles | o input, por último, com `controlsRight` | `controlsClass`, `controlsStyle` |

O input é uma linha que o app organiza: `flex-row` em `class`, e `flex-1` no campo para dar a ele o espaço que os botões deixam. Estados que as partes mostram:

- O input: `focus-within:` enquanto seu campo está em edição (um anel ao redor de todo o input), `disabled:`.
- O campo: `focus:` enquanto está em edição, `disabled:`.
- Um botão: `hover:` sob o ponteiro, `active:` enquanto pressionado, `disabled:` enquanto o input está desabilitado ou somente leitura e onde um passo não faria nada (o decremento em `min`, o incremento em `max`). Coloque o hover atrás de `enabled:` (`enabled:hover:bg-accent`) para que um botão desabilitado não se acenda.

A animação dos estados é escolha do app (`transition-colors`), e `motion-reduce:` a mantém parada para quem pede menos movimento.

<a id="keyboard"></a>

## Teclado

Enquanto o campo está em edição, o input aceita as teclas de spin button do WAI-ARIA, que se repetem enquanto pressionadas:

| Tecla | Ação |
|---|---|
| Seta para cima | Um passo para cima. |
| Seta para baixo | Um passo para baixo. |
| Page Up, Page Down | Dez passos para cima ou para baixo. |

Home e End continuam sendo do campo: movem o cursor no texto. Os botões não são paradas do foco do teclado: Tab vai do campo para o que vem depois do input, e um toque em um botão deixa o foco no campo (nos desktops, um toque move o foco para o campo quando ele estava em outro lugar; em telas sensíveis ao toque, o foco é deixado onde está, para que nenhum teclado apareça).

<a id="accessibility"></a>

## Acessibilidade

- O campo é um spin button (`"spinbutton"`) com seu rótulo, seu valor (o número que o texto representa, entre `min` e `max`) e seu texto.
- As ações de incremento e decremento de um leitor de tela (o deslizar para cima e para baixo do VoiceOver) fazem o passo, como Seta para cima e Seta para baixo.
- Os botões ficam ocultos para os leitores de tela, como os de um campo numérico de navegador: as ações de incremento e decremento do próprio campo fazem o passo.
- Enquanto `disabled`, os leitores de tela dizem que o campo está esmaecido.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e ações em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- O campo é o campo de texto da plataforma ([Input](./input.md)): o teclado, o cursor, a seleção, copiar e colar e os métodos de entrada são do sistema. Celulares mostram um teclado decimal, com um sinal quando `min` é menor que 0 ou não está definido.
- Toda plataforma desenha o que o app estiliza. Seta para cima / Seta para baixo e Page Up / Page Down chegam ao input a partir de um teclado físico em todas as plataformas.
