---
title: "Pagination"
description: "O componente Pagination: as páginas de um conjunto para navegar entre elas, com as páginas ao redor da atual, reticências, Anterior e Próxima, um paginador compacto, o teclado e a página atual para leitores de tela, estilizado pelo app."
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---


# Pagination

Uma paginação navega entre as páginas de um conjunto: resultados de busca, as linhas de uma tabela, um arquivo. Ela mostra Anterior, as páginas ao redor da atual (a primeira e a última sempre, e reticências para cada trecho omitido), os filhos do app e Próxima. Ela é responsável pelo comportamento: quais páginas aparecem, os acionamentos, o teclado, Anterior e Próxima desabilitados nas extremidades, o marco de navegação e a página atual para leitores de tela. A aparência fica a cargo do app: os itens não têm cor, tamanho ou rótulo próprios, e o app os estiliza ou os desenha.

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

`Pagination` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `pagination()` cria uma paginação com um setter por prop (`.page(..)`, `.total_pages(..)`), `.on_change(..)` para a página que o usuário escolhe, os métodos de estilo tipados para a linha e `.child(..)` para o conteúdo do app.

<a id="the-page"></a>

## A página

A página pertence ao app: `page` é a página atual, a partir de 1, e `onChange({ page })` informa a página que o usuário escolheu com um acionamento em uma página, em Anterior ou em Próxima. O app a define, carrega essa página e mostra suas linhas. `totalPages` é a quantidade de páginas; um `page` além da última mostra a última. A página atual não informa nada quando acionada, e o mesmo vale para Anterior na primeira página e Próxima na última.

<a id="the-pages-shown"></a>

## As páginas exibidas

Com `visiblePages` (no mínimo 5, o padrão), a linha mostra todas as páginas enquanto couberem. Acima disso, ela mostra a primeira e a última página, a atual com quantas páginas couberem de cada lado, `(visiblePages - 3) / 2`, e reticências para cada trecho de páginas omitido:

| `page` de 20, `visiblePages={7}` | Exibidas |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

Dez mil páginas mostram os mesmos sete itens. Um `visiblePages` ímpar centraliza a página atual.

<a id="items"></a>

## Itens

Cada item recebe o `itemClass` e o `itemStyle` do app: a página atual é `selected:`, um item que não aceita acionamento é `disabled:`, e o item com o foco do teclado é `focus:`. O app organiza a linha com `class` (uma linha por padrão; `gap-*`, `justify-*`).

Sem `renderItem`, uma página mostra seu número, as reticências mostram `…`, e Anterior e Próxima mostram seus rótulos de acessibilidade (`‹` e `›` se não houver rótulos). `renderItem` desenha o conteúdo de cada item a partir de um `PaginationItemState`:

| Campo | Tipo | Descrição |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | O que o item é. |
| `page` | `number` | O número de uma página; a página para a qual Anterior ou Próxima leva (a atual nas extremidades); a primeira página oculta de uma reticência. |
| `start`, `end` | `number` | As páginas ocultas de uma reticência: `start` incluída, `end` (a próxima página exibida) não. |
| `current` | `boolean` | A página atual. |
| `disabled` | `boolean` | Não aceita acionamento: Anterior na primeira página, Próxima na última, tudo em uma paginação desabilitada. |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

Uma reticência não aceita acionamento por conta própria: o que ela faz fica a cargo do app. Um `Menu` desenhado nela lista as páginas que ela oculta, como `JumpMenu` acima.

<a id="compact"></a>

## Compacto

`compact` mostra apenas Anterior, os filhos e Próxima: um paginador para telas estreitas, com a página indicada nos filhos.

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

Em ambas as formas, os filhos ficam depois das páginas e antes de Próxima: uma contagem de páginas, um campo para ir a uma página.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | obrigatório | A página atual, a partir de 1; o app a define em `onChange`. |
| `totalPages` | `.total_pages(..)` | `number` | obrigatório | Quantas páginas existem, no mínimo 1. |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | O máximo de páginas exibidas de uma vez, incluindo a primeira e a última; no mínimo 5. |
| `compact` | `.compact(..)` | `boolean` | `false` | Apenas Anterior, os filhos e Próxima. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nenhum item aceita acionamento ou foco do teclado; os estilos de `disabled:` se aplicam, e os leitores de tela informam que estão esmaecidos. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam a navegação: o que ela pagina. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `.previous_accessibility_label(..)`, `.next_accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para Anterior e Próxima, e o conteúdo deles sem `renderItem`. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | nenhum | A aparência de cada item: `selected:` na página atual, `disabled:`, `focus:`; os estilos de texto são repassados ao conteúdo. |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | nenhum | Desenha o conteúdo de cada item a partir de seu estado. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo do app depois das páginas e antes de Próxima. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A aparência e o layout da linha. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`: a página que o usuário escolheu com uma página, Anterior ou Próxima. A página atual nunca é informada. |

<a id="motion"></a>

## Movimento

A página atual se move de item para item conforme as classes `selected:` do app determinam: `transition-colors` em `itemClass` faz o destaque esmaecer da página deixada para a página alcançada. Uma mudança de página mantém cada item no lugar e altera o que os itens mostram, de modo que a linha nunca pisca; as transições do app ficam paradas com movimento reduzido (`motion-reduce:transition-none`).

<a id="accessibility"></a>

## Acessibilidade

- A linha é um marco de navegação nomeado por `accessibilityLabel`.
- Cada página, Anterior e Próxima é um botão. A página atual é anunciada como a página atual (`aria-current="page"` do ARIA) e está selecionada; Anterior na primeira página e Próxima na última ficam esmaecidos.
- No macOS e na web, cada página, Anterior e Próxima é uma parada do foco do teclado, e Return e Espaço a acionam. Uma página acionada pelo teclado mantém o foco assim que o app a exibe, onde quer que ela caia na linha, e o mesmo vale para a primeira ou a última página quando Anterior ou Próxima chega a ela.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: um acionamento é um toque que termina em um item.
- Desktops (macOS, Windows, Linux, GPUI) e web: um acionamento é um clique; no macOS e na web, Tab alcança os itens.
- Todas as plataformas desenham o que o app estiliza.
