---
title: "OtpInput"
description: "O componente OtpInput: um código numérico de uso único com tamanho fixo, digitado, colado ou preenchido automaticamente em um único campo nativo, exibido em células, grupos e um cursor que o app estiliza."
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---


# OtpInput

Um campo de código de uso único recebe um número fixo de dígitos (um código de verificação de uma mensagem de texto, o código de um autenticador) e os mostra em células. Ele cuida do comportamento: um único campo de texto nativo, transparente e posicionado sobre as células, recebe o teclado. Assim, digitação, métodos de entrada, colar, o teclado numérico e o preenchimento automático de códigos do sistema ("Das Mensagens" no iOS, sugestões de SMS no Android) são os da própria plataforma, e os leitores de tela encontram um único campo de texto. Só entram dígitos, até `length`; Backspace remove o último, e `onComplete` avisa quando o código está completo. A aparência fica por conta do app: um `OtpInput` não tem cores, tamanhos, bordas nem rótulo próprios. Suas partes são as células, os grupos em que elas se dividem e um cursor, e o app estiliza cada uma.

```rust tabs
use nsh_base::{OtpInputCompleteEvent, otp_input, theme};
use nsh_core::prelude::*;

fn verification(verify: impl Fn(&str) + 'static) -> impl IntoElement {
    let code = signal(SharedString::default());
    otp_input()
        .length(6)
        .groups(2)
        .value(move || Some(code.get()))
        .on_change(move |next: &SharedString| code.set(next.clone()))
        .on_complete(move |e: &OtpInputCompleteEvent| verify(&e.value))
        .accessibility_label("Verification code, 6 digits")
        .flex_row()
        .gap_3()
        .group_style(|s| s.flex_row().gap_2())
        .cell_style(|s| {
            s.w(px(40.0))
                .h(px(48.0))
                .items_center()
                .justify_center()
                .rounded(px(8.0))
                .border_1()
                .border_color(move || theme().input)
                .text_xl()
        })
        // The cell that takes the next digit, while the code has the focus,
        // and the cells that hold a digit.
        .cell_class("focus:border-ring data-filled:bg-muted")
        .caret_style(|s| s.w(px(2.0)).h(px(24.0)).bg(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { OtpInput } from "nsh/base";

function App() {
  const code = signal("");
  const verify = (value: string) => console.log(`checking ${value}`);
  return (
    <OtpInput
      length={6}
      groups={2}
      value={code()}
      onChange={({ value }) => code.set(value)}
      onComplete={({ value }) => verify(value)}
      accessibilityLabel="Verification code, 6 digits"
      class="flex-row gap-3"
      groupClass="flex-row gap-2"
      cellClass="w-10 h-12 items-center justify-center rounded-lg border border-input text-xl focus:border-ring data-filled:bg-muted"
      caretClass="w-0.5 h-6 bg-foreground"
    />
  );
}

mount(App);
```

`OtpInput` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `otp_input()` cria um com um setter por prop (`.length(..)`, `.cell_style(..)`), um método de listener por evento (`.on_complete(..)`) e os métodos de estilo tipados para o próprio input.

<a id="the-code"></a>

## O código

- **Controlado**: passe `value` e atualize-o em `onChange`. As células mostram o `value` que o app passa, como ele é; um valor definido pelo app (limpar o código após um código errado) nunca é reportado.
- **Não controlado**: passe `defaultValue` (ou nada) e leia o código em `onChange` e `onComplete`.

O que o usuário faz é lido a partir do campo, com o cursor sempre no final:

| O usuário | O código |
|---|---|
| Digita um dígito | Ele é adicionado ao final enquanto o código for menor que `length`; depois de completo, nada muda. |
| Digita um dígito de largura total (`０`–`９`, de um método de entrada do leste asiático) | O dígito ASCII é adicionado. |
| Digita qualquer outra coisa | Nada muda; o campo descarta. |
| Pressiona Backspace | O último dígito é removido. |
| Cola, ou o sistema preenche um código automaticamente | Seus dígitos são adicionados da mesma forma; um texto com `length` dígitos ou mais (`123-456`, o código de uma mensagem) substitui o código pelos seus primeiros `length` dígitos. |

`onChange` reporta cada mudança com o novo código, e `onComplete` vem em seguida quando a mudança preencheu a última célula, de modo que é ali que o app verifica o código.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | obrigatório | Quantos dígitos o código tem: uma célula para cada. |
| `value` | `.value(..)` | `string` | nenhum | O código, controlado pelo app (mostrado como está). Sem ele, o input mantém o seu próprio. |
| `defaultValue` | `.default_value(..)` | `string` | nenhum | O código inicial, enquanto `value` não estiver definido. |
| `masked` | `.masked(..)` | `boolean` | `false` | As células preenchidas mostram um marcador (bullet) no lugar do dígito, e o campo é seguro: os leitores de tela não leem o código, e o sistema o mantém fora de suas sugestões. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem foco e sem edição; os estilos `disabled:` se aplicam ao input e às suas partes, e os leitores de tela informam que ele está esmaecido. |
| `groups` | `.groups(..)` | `number` | `1` | Em quantos grupos as células são divididas, o mais uniformemente possível (3 + 3 para seis dígitos em dois); no mínimo um, no máximo um por célula. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para o campo: para que serve o código e quantos dígitos ele tem. |
| `cellClass`, `cellStyle` | `.cell_class(..)`, `.cell_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | nenhum | Cada célula: seu tamanho, borda e texto (`color`, `fontSize`, que o dígito herda); `focus:` e `data-filled:` estilizam seus estados (veja Partes). |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Cada grupo de células (`flex-row gap-2`). |
| `caretClass`, `caretStyle` | `.caret_class(..)`, `.caret_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O cursor: sua largura, altura e cor. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio input: a linha (ou coluna) ao redor de seus grupos. |

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | O usuário alterou o código: digitou, apagou, colou ou usou o preenchimento automático. |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | A alteração do usuário preencheu a última célula, depois de seu `onChange`. |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | nenhum | O input recebeu / perdeu o foco do teclado. |

<a id="ref-methods"></a>

## Métodos de ref

| Método | Rust | Descrição |
|---|---|---|
| `focus()` | `focus()` (`OtpInputApi`) | Recebe o foco do teclado e mostra o teclado virtual, como um toque no input faz. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com |
|---|---|---|
| O input | | `class`, `style` |
| Um grupo | o input, um por grupo | `groupClass`, `groupStyle`; `disabled:` acompanha o input |
| Uma célula | seu grupo, uma por dígito | `cellClass`, `cellStyle`; `focus:` na célula que recebe o próximo dígito enquanto o input tem o foco, `data-filled:` em cada célula que contém um dígito, `disabled:` acompanha o input |
| O dígito | uma célula preenchida | os estilos de texto da célula (`text-xl`, `font-semibold`); `•` enquanto `masked` |
| O cursor | a célula vazia que recebe o próximo dígito, enquanto o input tem o foco | `caretClass`, `caretStyle` |

A célula que recebe o próximo dígito é a seguinte ao último dígito, ou a última célula quando o código está completo. O cursor pisca como o de um campo de texto (meio segundo aceso, meio apagado, e fixo por um instante após cada edição), por meio de sua opacidade, de forma nativa, mantendo seu lugar no layout; com movimento reduzido, ele fica parado. Um toque em qualquer ponto do input o foca: o campo fica sobre as células.

Uma célula que contém um dígito, mascarado ou não, tem o atributo `data-filled`, de modo que as classes `data-filled:` estilizam as células que o usuário preencheu (uma borda mais forte, um preenchimento: `data-filled:border-foreground data-filled:bg-muted`), como o shadcn/ui escreve seus estados. Com `group` em `cellClass`, as classes `group-data-filled:` estilizam o que há dentro de uma célula preenchida, o seu dígito. As células mudam suas classes, nunca seu conteúdo, de modo que uma tecla reestiliza uma célula e não redesenha nada.

<a id="accessibility"></a>

## Acessibilidade

- Os leitores de tela encontram um único campo de texto, nomeado por `accessibilityLabel` (diga para que serve o código e seu tamanho: "Código de verificação, 6 dígitos") com o código como seu valor; as células ficam ocultas para eles. Enquanto `masked`, o campo é seguro, então o código não é lido em voz alta.
- O teclado é o da plataforma: o teclado numérico nos celulares, qualquer teclado nos desktops (só entram dígitos) e Backspace. Tab alcança o input como qualquer campo de texto.
- Enquanto `disabled`, ele não recebe foco, e os leitores de tela informam que está esmaecido.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas por plataforma

- iOS: o campo é um campo de código (`textContentType` `oneTimeCode`), então a barra QuickType oferece um código do Mensagens ou do Mail; o teclado numérico aparece. Um campo `masked` recomeça quando se digita nele de novo depois de perder o foco, como os campos seguros do iOS.
- Android: `autofillHints` `smsOTPCode` permite que o teclado e o serviço de preenchimento automático ofereçam o código de uma mensagem de texto; o teclado numérico aparece.
- macOS, Windows, Linux e web: a digitação e o colar vão para o campo (no navegador, com `inputmode="numeric"` para o teclado numérico do celular), e o ponteiro em forma de I (I-beam) aparece sobre as células.
