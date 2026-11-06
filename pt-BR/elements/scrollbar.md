---
title: "Scrollbar"
description: "O componente Scrollbar: uma barra de rolagem com a aparência própria do app para todas as scroll views e listas (um tema definido uma única vez) ou para apenas uma, posicionada onde o app quiser, cujo thumb acompanha o conteúdo e cujos arrastes e toques fazem a rolagem, exibida durante a rolagem, ao passar o mouse ou sempre, com fade in e fade out no tempo definido pelo app."
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---


# Scrollbar

Uma barra de rolagem dá a uma scroll view ou a uma lista uma barra com o visual próprio do app: uma pílula fina que se alarga sob o ponteiro, um trilho no tom da marca, uma barra ao lado de um cabeçalho fixo ou ao longo de dois painéis. Definida uma vez como tema do app, cada scroll view e cada lista desenha uma no lugar do indicador da plataforma ([Barras integradas](#built-in-bars)); quando posicionada pelo app, ela nomeia a scroll view que move e fica onde o app a colocar. Ela tem comportamento próprio: o comprimento e a posição do thumb acompanham o conteúdo, a viewport e o offset (inclusive enquanto uma lista cresce ou a janela é redimensionada); arrastar o thumb rola o conteúdo, e um toque no trilho leva o meio do thumb até ali; ela aparece enquanto o conteúdo rola, enquanto o ponteiro está sobre ela, ou sempre, e surge e desaparece com fade de forma nativa. O visual e o tempo ficam por conta do app: uma `Scrollbar` não tem cores, tamanhos nem raios próprios, e seus fades não levam tempo algum até que o app defina algum.

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

`Scrollbar` vem de [`nsh/base`](../modules/nsh-base.md), a crate `nsh-base` em Rust. Em Rust, `scrollbar()` cria uma com um setter por prop (`.scroll(..)`, `.thumb_style(..)`) e os métodos de estilo tipados para a própria barra; seu `scroll` recebe um `ElementRef` (ou um `ScrollbarTarget`).

<a id="built-in-bars"></a>

## Barras integradas

Toda scroll view e toda lista pode desenhar uma `Scrollbar` no lugar do indicador da plataforma, sem nenhuma barra para posicionar: `Scrollbar.setTheme` dá o visual do app à barra de cada view cujo `scrollbar` é `true`, uma única vez, onde quer que o app inicie. Cada view recebe sua própria barra sobre a viewport, que permanece ali enquanto o conteúdo rola (na thread principal, como as sticky views) e é desenhada acima do conteúdo; ela acompanha, rola e faz fade como uma `Scrollbar` posicionada faria.

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

Um `ScrollbarTheme` tem as props de uma barra que são iguais para toda view, e o visual de cada eixo:

| Campo | Tipo | Padrão | Descrição |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Quando as barras aparecem: [Quando aparece](#when-it-shows). |
| `motion` | `ScrollbarMotion` | troca instantânea, `idle` `2000` | Como aparecem e desaparecem: [Movimento](#motion). |
| `minThumbLength` | `number` | `48` | O menor comprimento que um thumb pode ter. |
| `vertical`, `horizontal` | `ScrollbarLook` | nenhum | O visual das barras das views verticais e das horizontais: `class` e `style` para o trilho, posicionado na viewport da view; `thumbClass` e `thumbStyle`; `accessibilityLabel`. Uma view cujo eixo não tem visual mantém o indicador da plataforma. |

Um `setTheme` posterior reestiliza as barras, e `Scrollbar.setTheme(null)` devolve às views o indicador da plataforma. Uma view pode receber um tema próprio como sua prop `scrollbar` (`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`), tenha o app definido um ou não; `scrollbar={false}` deixa uma view sem barra. Uma lista disposta na viewport de seu pai (`viewport="parent"`) rola junto com essa view e com sua barra. Um `Input` de várias linhas também recebe a barra do seu visual vertical, sobre o texto, que ele rola como o indicador próprio da view de texto faz.

<a id="the-scroll-view-it-moves"></a>

## A scroll view que ela move

`scroll` nomeia a scroll view ou a lista que a barra acompanha: seu `ref`. A barra a encontra assim que ela está na tela, então o `ref` pode ser definido por um elemento posterior na mesma renderização; escreva a barra depois de sua scroll view (ou mantenha o `ref` em um signal). Desative o indicador próprio da scroll view com `scrollbar={false}` e posicione a barra com `class`: sobre a borda da scroll view, em uma caixa `relative` ao redor de ambas, ou em qualquer outro lugar da tela.

- O thumb tem o comprimento da fração do conteúdo que a viewport mostra, ao longo da content box do trilho (dentro do seu padding), e não é menor que `minThumbLength`. Sua posição indica o quanto o conteúdo foi rolado; enquanto o conteúdo faz bounce além de uma extremidade, o thumb permanece nessa extremidade.
- Arrastar o thumb rola o conteúdo na mesma medida em que o thumb se move. Um toque no trilho leva o meio do thumb para baixo do ponteiro, e o arrasto continua a partir dali.
- Uma barra vertical acompanha uma scroll view vertical; `axis="horizontal"` cria uma barra para uma horizontal (posicione-a ao longo da borda inferior). Uma barra por eixo.
- As listas funcionam da mesma forma: o thumb acompanha o comprimento total da lista à medida que as linhas são medidas e adicionadas.

<a id="when-it-shows"></a>

## Quando aparece

| `mode` | Aparece |
|---|---|
| `"scrolling"` (padrão) | Enquanto o conteúdo rola, e até `motion.idle` depois que ele para; o ponteiro sobre a barra enquanto ela aparece a mantém visível. |
| `"hover"` | Enquanto o ponteiro está sobre a barra (onde ela aparece, mesmo oculta), e como `"scrolling"` faz. |
| `"always"` | Sempre. |

Em todos os modos, ela aparece enquanto seu thumb é arrastado e permanece `motion.idle` após o último scroll, arrasto ou hover. Enquanto o conteúdo cabe na viewport, ela permanece oculta. Oculta, a barra fica em `opacity: 0` e deixa os toques passarem para o que está embaixo dela.

<a id="motion"></a>

## Movimento

`motion` define o tempo dos fades da barra, que são executados de forma nativa, como o `ScrollbarMotion` de `gpui-base` faz:

| Campo | Padrão | Descrição |
|---|---|---|
| `idle` | `2000` | Por quanto tempo a barra permanece após o último scroll, arrasto ou hover, em milissegundos. |
| `enter` | `0` | Quanto tempo leva para aparecer: sua opacidade sobe linearmente, e um slide usa ease-out. |
| `exit` | `0` | Quanto tempo leva para desaparecer depois que `idle` termina, com ease-in; ela desliza para fora do trilho enquanto some. |
| `entrance` | `"fade"` | Como ela entra: `"fade"` no lugar, ou `"slideAndFade"` a partir da borda em que está (a direita, a inferior). |
| `thumbHoverEntrance` | `"fade"` | Como ela entra quando o ponteiro sobre seu thumb oculto a exibe (`"hover"`). |

Sem durações, a barra aparece e desaparece instantaneamente. Um fade revertido na metade mantém sua velocidade: ele dura a fração de sua duração que ainda falta percorrer. Uma barra `"always"` nunca é animada, nem qualquer barra enquanto o usuário pede menos movimento. O trilho recorta o que desliza. O movimento do próprio thumb, como uma largura que cresce em `hover:`, pertence ao estilo dele (`transition-all` em `thumbClass`).

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | nenhum | A scroll view ou lista que a barra acompanha e move (seu `ref`). |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | O eixo da scroll view: o trilho corre ao longo dele. Lido quando a barra é criada. |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Quando a barra aparece. |
| `motion` | `.motion(..)` | `ScrollbarMotion` | troca instantânea, `idle` `2000` | Como ela aparece e desaparece: [Movimento](#motion). |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | O menor comprimento do thumb em um conteúdo longo, para que continue fácil de agarrar. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O thumb. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem sobre a barra. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A barra: seu trilho, onde o app a posiciona. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com |
|---|---|---|
| O trilho | onde o app o posiciona | `class`, `style` |
| O thumb | a content box do trilho | `thumbClass`, `thumbStyle` |

A barra dimensiona o thumb ao longo do eixo e o move; sua espessura e sua posição transversal ao trilho ficam por conta do app (`w-1.5` e `items-end` no trilho colocam um thumb de 6 pontos à direita). O padding do trilho mantém o thumb afastado de suas extremidades e laterais.

Estados que as partes exibem:

- O trilho: `hover:` sob o ponteiro; ele é um `group`, então o thumb recebe `group-hover:` a partir dele (um thumb que se alarga quando o ponteiro se aproxima).
- O thumb: `hover:` sob o ponteiro, `active:` enquanto é arrastado.

A visibilidade da barra é sua opacidade: aplique a transparência às cores do fundo do trilho ou do thumb. Um thumb que se alarga recebe `transition-all` (isso nunca atrasa a posição do thumb, que a barra define separadamente dos estilos do thumb), e `motion-reduce:` o mantém parado para as pessoas que pedem menos movimento.

<a id="accessibility"></a>

## Acessibilidade

- A scroll view continua sendo o que os leitores de tela rolam: eles a movem com seus próprios gestos e leem seu conteúdo.
- A barra é rotulada por `accessibilityLabel` para os leitores de tela que chegam até ela.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e ações em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- Todas as plataformas desenham o que o app estiliza, e o thumb acompanha o offset que cada plataforma informa para a scroll view. Arrastar o thumb e tocar no trilho funcionam com mouse, caneta ou dedo.
- `"hover"` acompanha o ponteiro de um mouse ou de um touchpad (os desktops e a web); em uma tela sensível ao toque, a barra aparece enquanto o conteúdo rola, e seu trilho oculto deixa os toques passarem.
