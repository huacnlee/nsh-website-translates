---
title: "Slider"
description: "O componente Slider: um valor, ou um intervalo de dois, escolhido ao longo de uma trilha, com toques e arrastes em telas sensíveis ao toque e com mouse, as teclas de slider do WAI-ARIA e um valor para leitores de tela em cada marcador, além de uma trilha, um indicador, um intervalo e marcadores que o app estiliza."
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---


# Slider

Um slider escolhe um valor ao longo de um trilho (um volume, um brilho), ou um intervalo de dois valores com um thumb cada (um intervalo de preços). Ele é dono do seu comportamento: um toque no trilho move o thumb mais próximo até lá, um thumb acompanha um arrasto, com mouse ou com o dedo; os valores se ajustam ao `step`; cada thumb é uma parada do foco do teclado e se move com as setas, e é um elemento ajustável para leitores de tela, com seu próprio valor. O visual é do app: um `Slider` não tem cores, tamanhos, raios nem movimento próprios. Ele é feito de um trilho com um indicador dentro, a faixa e os thumbs sobre o indicador, e depois seus filhos (um rótulo, o valor como texto), e o app estiliza cada parte.

```rust tabs
use nsh_base::{SliderValue, slider, theme};
use nsh_core::prelude::*;

fn strength(level: Signal<SliderValue>) -> impl IntoElement {
    let percent = move || format!("{}%", level.get().end());
    slider()
        .value(move || level.get())
        .accessibility_label("Option strength")
        .on_change(move |next: &SliderValue| level.set(*next))
        // The value in a column after the rail.
        .flex_row()
        .items_center()
        .gap_2()
        // An 8-point rail; the thumbs travel inside it.
        .track_style(|s| s.h(px(8.0)).flex_1().px(px(8.0)).rounded_full().bg(move || theme().muted))
        .indicator_style(|s| s.h_full())
        // The fill, from the rail's edge, fading into the thumb's tone.
        .range_style(|s| {
            s.ml(-px(8.0))
                .rounded_full()
                .bg_linear_to_r()
                .gradient_from(move || theme().primary)
                .gradient_to(move || theme().muted_foreground)
        })
        // A 16 x 8 pill sitting in the rail.
        .thumb_style(|s| {
            s.w(px(16.0))
                .h(px(8.0))
                .rounded_full()
                .bg(move || theme().muted_foreground)
                .hover(|s| s.brightness(1.1))
                .active(|s| s.brightness(1.25))
        })
        .child(
            text(percent)
                .w(px(42.0))
                .text_right()
                .text_xs()
                .tabular_nums()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Slider } from "nsh/base";

function App() {
  const strength = signal(64);
  return (
    <Slider
      value={strength()}
      onChange={({ value }) => strength.set(value as number)}
      accessibilityLabel="Option strength"
      class="flex-row items-center gap-2"
      trackClass="h-2 flex-1 px-2 rounded-full bg-muted focus-within:ring-2 focus-within:ring-primary/36 focus-within:ring-offset-2 focus-within:ring-offset-background disabled:opacity-35"
      indicatorClass="h-full"
      rangeClass="-ml-2 rounded-full bg-linear-to-r from-primary via-primary to-muted-foreground"
      thumbClass="h-2 w-4 rounded-full bg-muted-foreground transition hover:brightness-110 active:brightness-125 focus:outline-none disabled:brightness-100 motion-reduce:transition-none"
      thumbStyle={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.42)" }}
    >
      <Text class="w-[42px] text-right font-mono text-[11px] text-muted-foreground">{`${strength()}%`}</Text>
    </Slider>
  );
}

mount(App);
```

`Slider` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `slider()` cria um com um setter por prop (`.value(..)`, `.thumb_style(..)`), um método de listener por evento (`.on_change(..)`), os métodos de estilo tipados para o próprio slider e `.child(..)` para o seu rótulo. Seu valor é um `SliderValue`: `Single(f64)` ou `Range(f64, f64)`.

<a id="value"></a>

## Valor

O valor é um número, ou `[start, end]` para um intervalo com dois thumbs; o formato do valor decide quantos thumbs existem. O app é dono dele com `value` e define o valor que `onChange` informa, como em todo controle do `nsh/base`; ou então deixa o valor a cargo do slider com `defaultValue`, e ainda assim recebe as mudanças. Durante um arrasto, os thumbs e a faixa seguem o ponteiro no mesmo frame, de forma nativa; quando o ponteiro é solto, o `value` do app volta a ser exibido, como o app o definiu para a última mudança do arrasto; os leitores de tela ouvem os valores do arrasto conforme ele avança, enquanto um está em andamento, e o valor final caso contrário.

```tsx
const price = signal<[number, number]>([200, 800]);

<Slider
  value={price()}
  onChange={({ value }) => price.set(value as [number, number])}
  onChangeEnd={({ value }) => save(value)}
  min={0}
  max={1000}
  step={10}
  accessibilityLabel="Maximum price"
  startAccessibilityLabel="Minimum price"
/>;
```

- `onChange` informa cada novo valor que o usuário pede: em um toque no trilho, a cada passo de um arrasto, a cada tecla. Cada informe é um novo valor.
- `onChangeEnd` informa o valor em que a mudança terminou, uma única vez: quando o ponteiro é solto após um toque ou um arrasto que definiu um valor, e após cada passo de tecla ou de leitor de tela (cada um é uma mudança completa). Salve ou envie o valor aqui.
- Os valores se ajustam a `step`, contados a partir de `min` (`min={1} step={2}` resulta em 1, 3, 5, ...), e ficam entre `min` e `max`; `max` é sempre alcançável, então o último passo é menor quando o intervalo não é um número inteiro de passos. `step={0}` aceita qualquer valor.
- Os thumbs de um intervalo nunca se cruzam: um thumb arrastado para no outro. Um arrasto que começa sobre dois thumbs com o mesmo valor move aquele que pode ir na direção do ponteiro.
- O valor exibido é o do app, limitado por `min` e `max` (as extremidades de um intervalo, em ordem), e um valor fora da grade do passo é exibido onde está; a próxima mudança do usuário se ajusta à grade.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | nenhum | O valor (controlado): um número, ou um intervalo com dois thumbs. O app define o valor que `onChange` informa. |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | O valor inicial enquanto `value` não está definido; o slider passa então a manter o seu próprio. |
| `min` | `.min(..)` | `number` | `0` | O menor valor. |
| `max` | `.max(..)` | `number` | `100` | O maior valor; um valor abaixo de `min` é `min`. |
| `step` | `.step(..)` | `number` | `1` | O passo ao qual os valores se ajustam, contado a partir de `min`; `0` aceita qualquer valor. |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | Como os valores se distribuem ao longo do trilho: uniformemente, ou por ordens de grandeza (de 1 a 1000, um terço do caminho é 10). A escala logarítmica exige `min` acima de 0; com um `min` menor, ela é linear. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | A direção do trilho: `min` no início (a esquerda, ou a direita em um layout da direita para a esquerda), ou embaixo. Lida quando o slider é criado. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nenhuma mudança por ponteiro, teclado ou leitor de tela; as classes `disabled:` se aplicam ao slider e às suas partes. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para o thumb (em um intervalo, o do fim). |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | O que os leitores de tela dizem para o thumb de início de um intervalo. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O trilho: a área que recebe toques e arrastos. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O indicador, a guia sobre a qual os valores são mapeados. |
| `rangeClass`, `rangeStyle` | `.range_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A faixa, de `min` até o thumb (entre os thumbs de um intervalo), posicionada pelo slider. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Cada thumb, centralizado em seu valor. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo após o trilho: um rótulo, o valor como texto. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio slider: a coluna (ou linha) ao redor do trilho e do rótulo. |

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | O usuário pediu um novo valor: um toque no trilho, um passo de um arrasto, uma tecla, um incremento ou decremento de um leitor de tela. |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | A mudança terminou: o ponteiro foi solto, ou um passo de tecla ou de leitor de tela foi concluído. Uma vez por mudança. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com |
|---|---|---|
| O slider | | `class`, `style` |
| O trilho | o slider, primeiro | `trackClass`, `trackStyle` |
| O indicador | o trilho | `indicatorClass`, `indicatorStyle` |
| A faixa | o indicador, posicionada pelos valores | `rangeClass`, `rangeStyle` |
| Um thumb (dois em um intervalo) | o indicador, centralizado em seu valor | `thumbClass`, `thumbStyle` |
| O rótulo | o slider, após o trilho | seus próprios elementos (`children`) |

O trilho recebe toques e arrastos. O comprimento do indicador é o intervalo de valores, com `min` na sua borda inicial (na parte de baixo quando vertical); o slider posiciona a faixa e os thumbs sobre ele, com cada thumb centralizado em seu valor, qualquer que seja o seu tamanho. Há duas formas de organizá-los:

- O trilho é a própria guia (o exemplo acima): `h-2 px-2 rounded-full bg-muted` com um indicador `h-full`. O padding mantém os thumbs dentro da guia nas duas extremidades, e o `-ml-2` da faixa inicia o preenchimento na borda da própria guia.
- O trilho é uma banda ao redor da guia, mais alta para que um dedo a encontre em uma tela sensível ao toque: `h-8 justify-center` com um indicador `h-2 rounded-full` (`w-8 items-center` e `w-2 h-full` em um slider vertical).

Estados que as partes exibem:

- Um thumb: `hover:` sob o ponteiro, `active:` enquanto é arrastado, `focus:` com o foco do teclado, `disabled:`.
- O trilho: `active:` enquanto um toque nele está arrastando; ele é um `group`, então o indicador, a faixa e os thumbs recebem `group-hover:` e `group-active:` dele.
- Todas as partes: `disabled:` enquanto o slider estiver.

Os thumbs se movem conforme o valor muda e acompanham um arrasto de imediato. O movimento dos estados dos thumbs é uma escolha do app (`transition` para um thumb que clareia em `hover:` e `active:`), e `motion-reduce:` o mantém parado para quem pede menos movimento. O foco do teclado pertence ao thumb: `focus-within:` no trilho desenha o anel ao redor de toda a guia enquanto um thumb o tem, e o `focus:outline-none` do thumb toma o lugar do contorno de foco da própria plataforma.

<a id="keyboard"></a>

## Teclado

No macOS e na web, cada thumb é uma parada do foco do teclado (Tab), e o thumb com foco responde às teclas de slider do WAI-ARIA:

| Tecla | Faz |
|---|---|
| Direita, Cima | Um passo para cima (também em um slider vertical). |
| Esquerda, Baixo | Um passo para baixo. |
| Page Up, Page Down | Um décimo do intervalo para cima ou para baixo (ao longo da escala), com no mínimo um passo. |
| Home, End | Tão para baixo ou tão para cima quanto o thumb puder ir (o início de um intervalo até o seu fim). |

Em um layout da direita para a esquerda, um slider horizontal corre a partir da direita, com seu `min` na extremidade direita: Esquerda é um passo para cima e Direita um passo para baixo, e um arrasto para a esquerda aumenta o valor. Um slider vertical mantém Direita e Cima como um passo para cima.

Cada tecla que altera o valor informa `onChange` e depois `onChangeEnd`. Setas e teclas de página se repetem enquanto são mantidas pressionadas. As teclas só chegam ao slider enquanto nenhum campo de texto está sendo editado.

<a id="accessibility"></a>

## Acessibilidade

- Cada thumb é um elemento ajustável (`"adjustable"`, um slider no navegador) com seu rótulo, seu valor e os valores que pode assumir: o início de um intervalo de `min` até o fim, e o fim do início até `max`, de modo que os leitores de tela leem e definem ambos. O valor é falado como o número com as casas decimais do passo (`2.5`).
- As ações de incremento e decremento de um leitor de tela (deslizar para cima e para baixo do VoiceOver) movem o thumb em um passo, como as setas do teclado.
- Os thumbs são os elementos do slider para leitores de tela, nomeados por `accessibilityLabel` (e o início de um intervalo por `startAccessibilityLabel`); um rótulo visível entre seus filhos é lido onde está.
- Enquanto `disabled`, os leitores de tela dizem que os thumbs estão esmaecidos, e eles não aceitam ações.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e ações em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- Todas as plataformas desenham o que o app estiliza. Toques e arrastos são acompanhados no núcleo, para mouse, caneta ou dedo, e uma scroll view ao redor do slider não captura um arrasto que começou nele.
- Tab move o foco do teclado entre os thumbs no macOS e na web, onde o thumb com foco responde às teclas do slider.
- Leitores de tela: o VoiceOver (iOS, macOS) e o TalkBack ajustam cada thumb; o UI Automation (Windows), a acessibilidade do GTK (Linux) e o navegador (`role="slider"`, `aria-valuenow`, `aria-valuetext`) recebem seu intervalo e seu valor.
