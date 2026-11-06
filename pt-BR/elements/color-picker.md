---
title: "ColorPicker"
description: "O componente ColorPicker e suas partes: uma cor escolhida em uma área de saturação e brilho, em controles deslizantes de qualquer canal de RGB, HSL, HSB ou OKLCH e do alpha, digitada em qualquer formato CSS, selecionada em amostras ou captada na tela com um conta-gotas, com as teclas e os elementos ajustáveis da WAI-ARIA para leitores de tela, com layout e estilo definidos pelo app."
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---


# ColorPicker

Um seletor de cor guarda uma cor, e as partes dentro dele a mostram e a alteram: uma `ColorArea` de saturação e
brilho, `ColorSlider`s de qualquer canal de RGB, HSL, HSB ou OKLCH e do alfa, `ColorField`s que recebem a
cor como texto ou um canal como número, `ColorSwatch`s de cores predefinidas e um `ColorEyeDropper` que escolhe uma cor
em qualquer lugar da tela. O app organiza as partes com seus
próprios elementos entre elas (uma linha por canal com sua letra, o espaço escolhido com `Tabs`, o seletor em um `Popover`),
e estiliza cada uma: as partes desenham as cores dos canais, e todo tamanho, raio, borda e sombra é do
app.

```rust tabs
use nsh_base::{
    ColorChannel, ColorPickerEvent, ColorSpace, color_area, color_field, color_picker,
    color_slider, color_swatch, theme,
};
use nsh_core::prelude::*;

fn primary(color: Signal<Hsla>) -> impl IntoElement {
    // A channel of OKLCH: its letter, its slider, its number.
    let channel = move |channel: ColorChannel, letter: &'static str| {
        view()
            .flex_row()
            .items_center()
            .gap_2()
            .child(text(letter).w(px(14.0)).text_sm().text_color(move || theme().muted_foreground))
            .child(
                color_slider()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .flex_1()
                    .h(px(18.0))
                    .justify_center()
                    .px(px(8.0))
                    .track_style(|s| s.h(px(10.0)).rounded_full())
                    .thumb_style(|s| s.size(px(16.0)).rounded_full().border_2().border_color(white()))
                    .fill_thumb(true),
            )
            .child(
                color_field()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .w(px(64.0))
                    .h(px(28.0))
                    .px_2()
                    .rounded_md()
                    .border_1()
                    .border_color(move || theme().border)
                    .text_sm(),
            )
    };
    color_picker()
        .value(move || Some(color.get()))
        .on_change(move |e: &ColorPickerEvent| {
            if let ColorPickerEvent::Change(value, _) = e {
                color.set(*value);
            }
        })
        .gap_3()
        .child(
            color_area()
                .accessibility_label("Saturation and brightness")
                .h(px(160.0))
                .panel_style(|s| s.rounded_lg())
                .thumb_style(|s| s.size(px(18.0)).rounded_full().border_2().border_color(white()))
                .fill_thumb(true),
        )
        .child(channel(ColorChannel::Lightness, "L"))
        .child(channel(ColorChannel::Chroma, "C"))
        .child(channel(ColorChannel::Hue, "H"))
        .child(color_swatch().size(px(28.0)).rounded_md())
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { type ColorChannel, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch } from "nsh/base";

const thumb = "rounded-full border-2 border-white";

function Channel(props: { channel: ColorChannel; letter: string }) {
  return (
    <View class="flex-row items-center gap-2">
      <Text class="w-[14px] text-sm text-muted-foreground">{props.letter}</Text>
      <ColorSlider
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="flex-1 h-[18px] justify-center px-2"
        trackClass="h-[10px] rounded-full"
        thumbClass={`size-4 ${thumb}`}
        fillThumb
      />
      <ColorField
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="w-16 h-7 px-2 rounded-md border border-border text-sm text-right"
      />
    </View>
  );
}

function App() {
  const primary = signal("oklch(54.6% 0.215 262.9)");
  return (
    <ColorPicker value={primary()} format="oklch" onChange={({ formatted }) => primary.set(formatted)} class="gap-3">
      <ColorArea accessibilityLabel="Saturation and brightness" class="h-40" panelClass="rounded-lg" thumbClass={`size-[18px] ${thumb}`} fillThumb />
      <Channel channel="lightness" letter="L" />
      <Channel channel="chroma" letter="C" />
      <Channel channel="hue" letter="H" />
      <View class="flex-row items-center gap-2">
        <ColorSwatch class="size-7 rounded-md" />
        <Text class="font-mono text-sm">{`--primary: ${primary()}`}</Text>
      </View>
    </ColorPicker>
  );
}

mount(App);
```

`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` e `ColorEyeDropper` vêm de [`nsh/base`](../modules/nsh-base.md),
o crate `nsh-base` em Rust. Em Rust, `color_picker()` e as funções de suas partes os criam com um setter por prop
(`.channel(..)`, `.thumb_style(..)`), um método de listener por evento (`.on_change(..)`) e os métodos de estilo tipados; a
cor é um `Hsla`, os espaços, canais e formatos são `ColorSpace`, `ColorChannel` e `ColorFormat`.

<a id="value"></a>

## Valor

A cor é uma cor CSS: hex (`#3b82f6`, `#3b82f680` com seu alfa), `rgb()`, `hsl()`, `hsb()`, `oklch()` ou um nome CSS; em Rust, um `Hsla`. O app a controla com `value` e define a que `onChange` reporta, como em todo controle de
`nsh/base`; ou deixa a cor com o seletor usando `defaultValue` e ouve as mudanças do mesmo jeito.

- `onChange({ value, formatted })` reporta cada cor que o usuário pede: a cada passo de um arrasto na área ou em um slider,
  a cada tecla, o número de um campo conforme é digitado, uma amostra pressionada. `value` é a cor, `formatted` a mesma cor
  escrita como `format` determina (`"hex"`, `"rgb"`, `"hsl"`, `"hsb"` ou `"oklch"`), pronta para salvar ou para definir como token.
- `onChangeEnd({ value, formatted })` reporta a cor em que a mudança terminou, uma única vez: quando o ponteiro é solto, após cada tecla,
  quando um campo perde o foco ou é enviado, quando uma amostra é pressionada.
- O seletor guarda a cor em cada espaço como o usuário a definiu. Um cinza mantém seu matiz e sua saturação, então o slider de matiz
  permanece onde o usuário o deixou; uma cor editada em OKLCH mantém sua luminosidade, croma e matiz como digitados, inclusive além do que
  o sRGB mostra (a cor reportada é a mais próxima que o sRGB mostra, e `formatted` em `"oklch"` mantém os canais).
- Um `value` definido pelo app que o seletor não reportou substitui a cor em todos os espaços.

<a id="spaces-and-channels"></a>

## Espaços e canais

| `colorSpace` | Canais (`channel`) | Intervalos |
|---|---|---|
| `"rgb"` | `"red"`, `"green"`, `"blue"` | 0 a 255 |
| `"hsl"` | `"hue"`, `"saturation"`, `"lightness"` | matiz 0 a 360, os demais 0 a 100 |
| `"hsb"` | `"hue"`, `"saturation"`, `"brightness"` | matiz 0 a 360, os demais 0 a 100 |
| `"oklch"` | `"lightness"`, `"chroma"`, `"hue"` | luminosidade 0 a 100 (de 0,1 em 0,1), croma 0 a 0,4 (de 0,001 em 0,001), matiz 0 a 360 (de 0,1 em 0,1) |
| qualquer | `"alpha"` | 0 a 100 |

O trilho de um slider desenha as cores do seu canal mantendo os outros canais fixos, de modo que mostra para onde cada valor leva. Um
canal que o seu espaço não tem vira o primeiro canal do espaço (um aviso informa isso).

## Props

### ColorPicker

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | nenhum | A cor (controlada). O app define a que `onChange` reporta. |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | A cor inicial enquanto `value` não estiver definido; o seletor então mantém a sua própria. |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | Como `formatted` escreve a cor. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nenhuma mudança vinda de qualquer parte; as classes `disabled:` se aplicam ao seletor e às suas partes. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | As partes e os elementos do app entre elas. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio seletor: a coluna (ou linha) em volta de suas partes. |

### ColorArea

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `panelClass`, `panelStyle` | `.panel_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O painel, preenchendo a área: as cores do matiz, com a saturação da esquerda para a direita (da direita para a esquerda em um layout da direita para a esquerda) e o brilho de baixo para cima, recortado nos seus cantos. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O thumb, centralizado na cor. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | O fundo do thumb é a cor. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nenhuma mudança por ponteiro, teclado ou leitor de tela. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para o thumb. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A área: seu tamanho é do app. |

### ColorSlider

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | O espaço do canal. |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | O canal que ele altera: um dos canais do espaço, ou `"alpha"`. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | A direção do trilho: o menor valor no início (a esquerda, ou a direita em um layout da direita para a esquerda), ou embaixo. Lida quando o slider é criado. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O trilho: as cores do canal ao longo dele, recortadas nos seus cantos; o thumb é posicionado sobre ele. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O thumb, centralizado no valor. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | O fundo do thumb é a cor (com seu alfa em um slider de alfa). |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | nenhum | A cor de um padrão xadrez sob o trilho, que aparece através das cores de um slider de alfa. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | O lado dos quadrados do xadrez. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nenhuma mudança por ponteiro, teclado ou leitor de tela. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para o thumb. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O slider: a faixa em volta do trilho que recebe toques e arrastos. |

### ColorField

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | nenhum | O canal que ele recebe como número. Sem ele, o campo recebe a cor inteira como texto. |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | O espaço de `channel`. |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | Como o campo escreve a cor inteira. Ele lê qualquer forma CSS. |
| `placeholder` | `.placeholder(..)` | `string` | nenhum | Exibido enquanto o campo está vazio. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem digitação. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para o campo. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<TextStyle>` | nenhum | O campo, uma entrada de texto. |

O campo de um canal altera a cor conforme um número é digitado, limitado ao intervalo do canal; o campo da cor inteira a altera
quando o campo perde o foco ou é enviado, se o texto puder ser lido como uma cor. Sair de um campo reescreve seu valor na sua
forma.

### ColorSwatch

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | nenhum | A cor que ela mostra; um toque a escolhe no seletor em volta. Sem ela, a própria cor do seletor: uma pré-visualização. |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo enquanto ela é a cor do seletor, como classes `selected:`. |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | nenhum | Um padrão xadrez sob uma cor translúcida. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | O lado dos seus quadrados. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem toques. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | a cor em hex | O que os leitores de tela dizem. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Conteúdo sobre a cor: um sinal de seleção na amostra selecionada (`group-selected:`). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A amostra: seu tamanho, forma e borda; seus cantos recortam a cor. |

### ColorEyeDropper

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem toques. Também fica desabilitado onde a plataforma não tem conta-gotas. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Seu conteúdo: o ícone ou o rótulo do app. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O botão. |

Um toque mostra o conta-gotas do sistema: o color sampler do AppKit no macOS, o `EyeDropper` do navegador na web (Chrome
e Edge). A cor escolhida passa a ser a do seletor (`onChange`, depois `onChangeEnd`); Escape não escolhe nenhuma. Onde a plataforma
não tem conta-gotas, o botão fica desabilitado, e `disabled:hidden` o oculta ali.

<a id="events"></a>

## Eventos

| Evento | De | Rust | Payload | Quando |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | O usuário alterou a cor. |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | A mudança terminou. Uma vez por mudança. |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | A amostra foi pressionada; também funciona sozinha, como o chip de uma paleta. |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | O usuário escolheu uma cor na tela; também funciona sozinho. |

Em Rust, `ColorPickerEvent::Change(Hsla, SharedString)` e `ColorPickerEvent::ChangeEnd(Hsla, SharedString)` carregam a
cor e o seu texto `formatted`.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com |
|---|---|---|
| `ColorArea` | o seletor | `class`, `style` |
| O painel da área | a área, preenchendo-a | `panelClass`, `panelStyle` |
| O thumb da área | a área, centralizado na cor | `thumbClass`, `thumbStyle` |
| `ColorSlider` | o seletor | `class`, `style` |
| O trilho do slider | o slider | `trackClass`, `trackStyle` |
| O thumb do slider | o slider, centralizado no valor sobre o trilho | `thumbClass`, `thumbStyle` |
| `ColorField` | o seletor | `class`, `style` |
| `ColorSwatch` | o seletor, ou sozinha | `class`, `style`, `selectedStyle` |
| `ColorEyeDropper` | o seletor, ou sozinho | `class`, `style` |

O thumb de um slider é centralizado nas extremidades do trilho nas extremidades do canal. Um padding no slider de metade da
largura do thumb (`h-6 justify-center px-2.5` em volta de um trilho `h-3`) mantém o thumb inteiro dentro do slider, onde ele recebe
toques nas duas extremidades. Estados que as partes mostram: o `active:` de um thumb enquanto ele é arrastado e o `focus:` com o foco
do teclado, o `selected:` de uma amostra, e o `disabled:` de toda parte.

<a id="keyboard"></a>

## Teclado

No macOS e na web, cada thumb é uma parada do foco do teclado (Tab):

| Tecla | Em um slider | Na área |
|---|---|---|
| Right, Up | Um passo para cima | Right: mais saturação; Up: mais brilho |
| Left, Down | Um passo para baixo | Left: menos saturação; Down: menos brilho |
| Shift com uma seta | Dez passos | Dez passos |
| Page Up, Page Down | Dez passos | Dez passos de brilho |
| Home, End | As extremidades do canal | |

Em um layout da direita para a esquerda, um slider horizontal e a área correm a partir da direita, com o menor valor (a menor
saturação) na extremidade direita: Left é um passo para cima e Right um passo para baixo, e um toque ou um arrasto escolhe o valor sob o
ponteiro como ele é desenhado. Um slider vertical mantém Right e Up como um passo para cima; Up e Down na área mantêm o brilho.

Uma amostra aceita Space e Return. Cada tecla reporta `onChange` e depois `onChangeEnd`; as setas se repetem enquanto pressionadas.

<a id="accessibility"></a>

## Acessibilidade

- O thumb da área e o de cada slider são elementos ajustáveis (`"adjustable"`, um slider no navegador) com seu
  rótulo, valor e intervalo; o incremento e o decremento dos leitores de tela os movem passo a passo.
- Cada campo é um campo de texto com seu rótulo; cada amostra um botão, selecionado enquanto é a cor do seletor, nomeado por
  sua cor em hex, a menos que `accessibilityLabel` a nomeie. O conta-gotas é um botão com o rótulo do app.
- Enquanto desabilitadas, os leitores de tela dizem que as partes estão esmaecidas, e elas não recebem nenhuma ação.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e ações em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- Toda plataforma desenha o que o app estiliza; as cores dos trilhos e do painel são gradientes desenhados pela plataforma.
  Toques e arrastos são acompanhados no core, para um mouse, uma caneta ou um dedo, e uma scroll view em volta do seletor
  mantém sua rolagem para arrastos que começam em outro lugar.
- `ColorEyeDropper` escolhe com o color sampler do AppKit no macOS e com o `EyeDropper` do navegador na web; a cor
  chega em sRGB.
