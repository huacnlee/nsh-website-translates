---
title: "Carousel"
description: "Carousel e suas partes: slides exibidos um por vez, movidos por gesto de deslizar, pela roda do mouse e pelo touchpad na rolagem nativa da plataforma, por controles de anterior e próximo, por uma paginação e pelo teclado, dando a volta nas extremidades sem emendas. O carousel controla qual slide é exibido, o encaixe (snapping), o loop, as teclas e a acessibilidade; a aparência e todos os rótulos ficam a cargo do app."
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---


# Carousel

Um carousel mostra um slide de cada vez: as fotos de um produto, os passos de um onboarding, um banner que avança sozinho, uma fileira de cards. `Carousel` cuida do comportamento: qual slide aparece, o swipe entre eles, os controles de anterior e próximo, uma paginação, as setas do teclado, dar a volta nas pontas e o que os leitores de tela anunciam. Suas partes o encontram por contexto, então o app as organiza livremente em seu próprio layout. A aparência é do app: sem cores, tamanhos, setas, pontos ou rótulos próprios.

O conteúdo é uma scroll view nativa. Um dedo, a roda do mouse e o touchpad movem os slides na main thread da plataforma, no mesmo frame do ponteiro, e ao soltar o conteúdo se encaixa no slide mais próximo, um slide por fling. Quando ele para, o carousel informa o slide com `onChange`. Os controles, a paginação, as teclas e o `index` do app rolam o conteúdo nativamente até o slide, com animação.

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel` e suas partes vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. O slide
exibido é o `index` do app: um swipe, um controle ou uma tecla informa o próximo com `onChange`, e o
carousel rola até o `index` que o app devolve. O slide em que um swipe para continua exibido até o app responder ao seu
`onChange`: ele permanece quando o app o devolve como `index`, e o conteúdo volta com efeito de mola ao slide do app,
com animação, quando o app mantém o `index` que tinha. Sem `index` o carousel mantém o seu próprio, a partir de `defaultIndex`. Em Rust,
`carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`,
`carousel_pagination()` e `carousel_pagination_item()` criam as partes, com um setter por prop
(`.index(..)`), um listener por evento (`.on_change(..)`), os métodos de estilo tipados e `.child(..)` para o conteúdo delas.

## Props

### Carousel

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | nenhum | O slide exibido, a partir de 0, limitado aos slides existentes. O app é o dono dele: as mudanças são informadas com `onChange`, e um novo `index` rola até lá, com animação. |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | O slide exibido inicialmente, enquanto `index` não está definido. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | A direção em que os slides se sucedem; lida quando o carousel é criado. As setas do teclado de um carousel vertical são Cima e Baixo. |
| `looping` | `.looping(..)` | `boolean` | `false` | Os slides dão a volta: depois do último vem o primeiro, e antes do primeiro o último, sem emendas visíveis, tanto para um swipe, anterior, próximo, as teclas quanto para o `index` do app ([Loop](#looping)). Lida quando o carousel é criado. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o carousel, uma região: o que são seus slides (`"Featured products"`). |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O `CarouselContent`, os controles e o que mais o app dispuser ao redor deles. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout do carousel: onde ficam o conteúdo e os controles. |

### CarouselContent

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os `CarouselItem`s, cada um filho do conteúdo. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O tamanho da viewport e a trilha que os slides formam nela: um `gap` entre eles, um padding que mostra um trecho dos slides ao lado do que está em exibição. |

### CarouselItem

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o slide, um grupo: seu lugar entre os demais e o que ele mostra (`"2 of 5: Ocean view"`). |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo do slide. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | Seu tamanho ao longo do eixo (`w-full` para um slide por visualização, `basis-1/3` para três) e sua aparência. Em um carousel com loop, sua translação é do carousel: coloque um `transform` em uma view dentro dele. |

### CarouselPrevious, CarouselNext

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O nome do controle, quando seus filhos não têm texto que o diga (um ícone de seta). |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O ícone ou rótulo do app. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | Sua aparência e posição: ao lado do conteúdo, ou `absolute` sobre a borda dele. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nenhum | Seu estilo quando pressionado, com hover, com foco, ou desabilitado em uma ponta, como as classes `<state>:`. |

### CarouselPagination

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o grupo de itens de paginação (`"Choose a slide"`). |
| `indicatorClass` | `.indicator_class(..)` | `string` | nenhum | As classes Tailwind do indicador, uma view sobre o item do slide exibido (uma pílula atrás dos pontos, um sublinhado): sua aparência e sua posição no eixo transversal da fileira (`inset-y-0`, `bottom-0 h-0.5`). Ao longo da fileira, ele ocupa esse item e se move com efeito de mola, nativamente, até o próximo. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do indicador, sobre `indicatorClass`. Sem nenhum dos dois, a paginação não tem indicador. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os `CarouselPaginationItem`s, e o que mais o app dispuser entre eles. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout da fileira (`flex-row gap-2`). |

### CarouselPaginationItem

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | obrigatória | O slide que ele representa, a partir de 0. Um índice além do último slide fica desabilitado. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | Seu estilo enquanto seu slide está em exibição, como classes `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Qual slide ele representa (`"Slide 3"`), quando seus filhos não têm texto que o diga (um ponto). |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O ponto, a miniatura ou o número do app. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | Sua aparência; as classes `group-selected:` dentro dele o acompanham sob `group`. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | O usuário foi para outro slide: um swipe, a roda do mouse ou o touchpad parou nele, ou um controle, um item de paginação ou uma tecla o pediu. `{ index }` é esse slide. Um novo `index` vindo do app não informa nada. |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | O usuário começou a arrastar o conteúdo (um dedo, o touchpad). |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | O conteúdo que o usuário arrastou parou. |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | O foco do teclado entrou no carousel: na sua própria view, no controle anterior ou próximo, em um item de paginação ou em uma view focável dentro de um slide. Mover-se entre eles não informa nada. |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | O foco do teclado saiu do carousel: de sua própria view, de seus controles, de seus itens de paginação e do conteúdo dos slides. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| O carousel | | `Carousel` de `class`, `style` | `focus:` |
| O conteúdo | o carousel | `CarouselContent` de `class`, `style` | |
| Um slide | o conteúdo | `CarouselItem` de `class`, `style` | |
| Anterior, próximo | o carousel | seus `class`, `style` | `disabled:`, `active:`, `hover:`, `focus:` |
| A paginação | o carousel | `CarouselPagination` de `class`, `style` | |
| O indicador | a paginação | `indicatorClass`, `indicatorStyle` | |
| Um item de paginação | a paginação | seus `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` |

<a id="several-slides-per-view"></a>

## Vários slides por visualização

A largura de um slide é a de sua própria classe, então uma fileira de cards são vários slides na viewport. Cada slide é um ponto de snap
onde começa: o conteúdo para com esse slide onde o primeiro para, então um padding antes do primeiro é mantido
antes de cada um. No fim do intervalo, os slides que não conseguem chegar a esse lugar param junto com o último, e o próximo para
ali. `index` nomeia o slide na primeira posição; os slides que param com o último mostram o mesmo lugar, e um
swipe ali informa o primeiro deles:

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

`basis-1/2` na largura de um celular, ou `basis-[85%]`, mostra um trecho do próximo card. Um carousel vertical
(`axis="vertical"`) dimensiona seus slides pela altura.

<a id="looping"></a>

## Loop

Com `looping`, os slides dão a volta sem emendas visíveis: depois do último vem o primeiro, seja com swipe, com o próximo ou as
teclas, ou definido pelo `index` do app, sem retroceder pelos slides do meio. O conteúdo reserva espaço de uma volta inteira
de slides antes e depois deles, e desenha cada slide onde ele está mais perto do meio da visualização; a animação executa
isso nos frames da própria plataforma, junto com a rolagem. Cada slide existe uma única vez: os leitores de tela e a paginação o veem
uma única vez.

O loop é contínuo enquanto os slides cobrem a viewport mais um slide (três slides de largura total, ou cinco com um
terço de largura). Com menos que isso, anterior, próximo e as teclas ainda dão a volta, rolando de volta pelos slides.

<a id="slides-that-move-on-by-themselves"></a>

## Slides que avançam sozinhos

Um banner que avança é do app: um timer que define `index`. O carousel informa quando o usuário está interagindo com ele, então o
timer espera nesse momento, como pede o [padrão de carousel do WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/):
`onDragStart` / `onDragEnd` em torno de um arrasto, `onFocus` / `onBlur` enquanto o foco do teclado está no carousel (nele,
em seus controles, em sua paginação ou no conteúdo dos slides), e o ponteiro sobre uma view ao redor. Deixe desligado com movimento reduzido e dê aos usuários um botão que o interrompa (o controle de rotação):

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

Ler `index()` no effect reinicia um intervalo inteiro após cada mudança, inclusive a do usuário. Com
`looping`, ir do último slide ao primeiro avança através da emenda.

<a id="accessibility"></a>

## Acessibilidade

- O carousel é uma região nomeada por `accessibilityLabel`; cada slide é um grupo nomeado por seu próprio rótulo (seu lugar entre os
  demais e o que ele mostra).
- Anterior e próximo são botões, desabilitados nas pontas a menos que o carousel tenha loop; cada item de paginação é um botão,
  selecionado enquanto seu slide está em exibição.
- Todo rótulo é do app, no idioma do app.
- Os slides de um carousel com loop existem cada um uma única vez, onde quer que sejam desenhados.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="keyboard"></a>

## Teclado

No macOS e na web, onde Tab alcança as views que recebem toques, o carousel é uma parada do foco do teclado,
assim como seus controles e itens de paginação. Enquanto um deles tem o foco:

| Tecla | O que faz |
|---|---|
| Esquerda, Direita (Cima, Baixo na vertical) | Vai para o slide anterior ou o próximo, dando a volta nas pontas com loop. |
| Home, End | Vai para o primeiro ou o último slide. |
| Espaço, Return | Aciona o controle ou o item de paginação em foco. |

Em um layout da direita para a esquerda, os slides de um carousel horizontal correm a partir da direita, então Esquerda vai para o próximo slide e Direita
para o anterior; um carousel vertical mantém Cima e Baixo. Um controle que fica desabilitado enquanto tem o foco (o próximo em
o último slide) passa o foco para o carousel, para que as teclas continuem funcionando ali. Views focáveis do app dentro dos
slides mantêm suas próprias teclas: as setas de um input movem o cursor de texto.

<a id="motion"></a>

## Movimento

- Um swipe, a roda do mouse e o touchpad movem os slides junto com o ponteiro, no mesmo frame: a plataforma os rola.
- Ao soltar, o conteúdo desliza até o slide mais próximo, um slide por fling, como a plataforma faz o snap.
- Anterior, próximo, um item de paginação, uma tecla e o `index` do app rolam o conteúdo até o slide, com animação;
  com movimento reduzido, instantaneamente.
- O indicador da paginação se move com efeito de mola até o item do slide exibido; com movimento reduzido, move-se instantaneamente.
- `looping` vai do último slide ao primeiro avançando um passo, através da emenda; quando o conteúdo para, ele
  volta uma volta inteira sem animação, o que não muda nada na tela.

<a id="platform-notes"></a>

## Notas por plataforma

- iOS, Android e Mac Catalyst: um dedo desliza os slides; um toque aciona um controle.
- Desktops (macOS, Windows, Linux, GPUI) e a web: a roda do mouse e o touchpad rolam os slides, e um clique
  aciona um controle. Um arrasto do mouse sobre o conteúdo é do app, como em toda scroll view nessas plataformas.
- Todas as plataformas desenham o que o app estiliza: os slides, os controles, a paginação e seu indicador.
