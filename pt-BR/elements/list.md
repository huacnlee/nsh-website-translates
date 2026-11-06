---
title: "List"
description: "A lista virtualizada com reciclagem: linhas, colunas, cabeçalhos fixos, listas invertidas para chat, visibilidade e rolagem até itens."
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---


# List

`List` exibe dados longos ou ilimitados. Existem apenas as linhas próximas da viewport: conforme o usuário rola, as linhas que saem são recicladas para as linhas que entram. Quais linhas existem, suas posições, colunas, cabeçalhos fixos e visibilidade são todos calculados nativamente, então rolar uma lista com milhares de itens custa o mesmo que rolar uma lista com vinte. Em Rust, uma lista é criada com `virtual_list(count, |at| row)`; em TSX, com `<List>` de `nsh`.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Contact {
    id: usize,
    name: String,
}

fn app() -> impl IntoElement {
    let contacts = signal(
        (0..1000).map(|i| Contact { id: i, name: format!("Contact {}", i + 1) }).collect::<Vec<_>>(),
    );
    virtual_list(move || contacts.with(|c| c.len()), move |at| {
        view().h(px(56.0)).px_4().justify_center().child(
            text(move || contacts.with(|c| format!("{}. {}", at.index() + 1, c[at.index()].name)))
                .text_base(),
        )
    })
    .estimated_item_size(px(56.0))
    .flex_1()
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Contact ${i + 1}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={56} style={{ flex: 1 }}>
      {(contact, index) => (
        <View style={{ height: 56, paddingHorizontal: 16, justifyContent: "center" }}>
          <Text style={{ fontSize: 16 }}>
            {index() + 1}. {contact().name}
          </Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

Em TSX, `List` é genérico: `List<T>` verifica se `each` e a função de linha concordam quanto ao tipo do item, que o TypeScript infere a partir de `each` (veja a [List API](../modules/nsh-list.md)). Em Rust, `virtual_list` recebe o número de linhas (um valor, um signal ou uma closure: a lista cresce e diminui no lugar) e a função que constrói a linha em um `Position`; as linhas leem os dados do componente por `at.index()`.

Para uma lista curta, cujas linhas devem existir todas (uma página de configurações, um formulário), um [`Each`](./control-flow.md) dentro de uma [scroll view](./scroll.md) é mais simples. Para uma lista estilizada como tabela agrupada, veja [uma lista no estilo de configurações](../docs/lists.md#a-settings-style-list). O [guia de listas](../docs/lists.md) cobre padrões: carregamento infinito, chat, seções.

<a id="rows-are-recycled"></a>

## Linhas são recicladas

A função de linha é executada uma vez por célula, não uma vez por item. Quando uma célula é reutilizada para outro item, sua posição muda (TSX: os acessores `item()` e `index()`; Rust: `at.index()`) e tudo que a lê é atualizado:

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| {
    text(move || messages.with(|m| m[at.index()].body.clone()))
})
```

```tsx tabs
<List each={messages()}>
  {(message) => <Text>{message().body}</Text>}
</List>
```

Portanto, mantenha o estado por item nos seus dados (indexado por id), e não em signals criados dentro da função de linha: esse signal permanece com a célula e aparece em outro item.

As células que aguardam seu próximo item ficam ocultas quando sua linha deixa de existir ou é exibida por outra célula, de modo que leitores de tela, toques e testes de UI encontrem cada linha uma única vez.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Os itens. |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | Renderiza uma linha. |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | O tamanho dos itens ainda não medidos, em pontos. Estimativas próximas mantêm a barra de rolagem estável. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Rola na horizontal. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: a lista rola em uma scroll view própria. `"parent"`: ela ocupa todo o seu comprimento no layout do pai e renderiza as linhas próximas da viewport da scroll view ao redor, que a rola junto com o restante da página (veja [listas em uma página](../docs/lists.md#lists-in-a-page-viewportparent)). Escolhido quando a lista é criada. |
| `numColumns` | `.columns(n)` | `number` | `1` | Itens por linha (listas verticais). |
| `inverted` | `.inverted()` | `boolean` | `false` | Disposta a partir do fim, com o item 0 por último (estilo chat): começa rolada até o fim e mantém sua distância do fim conforme o conteúdo muda. |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | Para listas não invertidas: no fim do conteúdo, ou a essa quantidade de pontos dele, a lista permanece no fim conforme o conteúdo cresce ou a viewport diminui; se estiver rolada mais para cima, o conteúdo visível permanece. |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | Itens que ficam fixos no início depois de rolados para além dele (uma coluna, não invertida). |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, `.row_gap(..)`, `.column_gap(..)`, … | `ListContentStyle` | | Padding e espaçamentos do conteúdo, em pontos: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`. |
| `contentClass` | | `string` | | Padding e espaçamentos do conteúdo como classes (`p-*`, `gap-*`); `contentStyle` prevalece sobre elas. |
| `header` | `.header(el)` | `ListSlot` | | Antes dos itens: um componente (`Header`) ou um elemento (`<Header />`). |
| `footer` | `.footer(el)` | `ListSlot` | | Depois dos itens. |
| `empty` | `.empty(el)` | `ListSlot` | | Exibido no lugar dos itens enquanto `each` estiver vazio. |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | Entre os itens (uma coluna). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Rola até este item antes do primeiro frame. |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`, `item.id` ou o índice | A chave de um item nos tokens de visibilidade. Em Rust, as identidades das linhas, de modo que elas mantêm suas células e tamanhos quando linhas entram e saem antes delas. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | O fim está próximo: carregue mais. |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | A que distância do fim (em viewports) `onLoadMore` é disparado. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | O início está próximo, depois que o usuário ou um comando de rolagem moveu a lista: carregue o que vem antes do primeiro item. |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | A que distância do início (em viewports) `onLoadMoreAtStart` é disparado. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Itens se tornaram visíveis ou deixaram de ser visíveis. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Quando os itens contam como visíveis (abaixo). |
| `refreshing` | `.refreshing(..)` | `boolean` | | O spinner de pull-to-refresh é exibido. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | O usuário puxou para atualizar. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | O app desenha seu próprio indicador, com `height` pontos de altura: o spinner da plataforma fica oculto, um puxão atualiza assim que atinge `height`, e durante a atualização `height` é mantido acima do conteúdo. Uma altura igual ou menor que 0 significa nenhum. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | Um valor animado alimentado com o quanto a lista foi puxada além do topo (0 em repouso, crescendo com o puxão; o espaço mantido acima do conteúdo durante a atualização: `height` com `refreshIndicator`), para o indicador do app. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | O indicador de rolagem é exibido: o da plataforma, ou a [barra integrada](./scrollbar.md#built-in-bars) do app depois que ele define um tema; um objeto é um tema próprio da view. No desktop e em navegadores desktop, uma view horizontal o mantém: ele é a barra de rolagem do mouse. |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Um valor animado alimentado com o offset de rolagem, para animações vinculadas à rolagem. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Se arrastar dispensa o teclado. |
| `style` | métodos de `Styled` | `StyleProp<ViewStyle>` | | O estilo próprio da lista (ela precisa de um tamanho limitado: `flex: 1` ou uma altura). |
| `testID` | `.test_id(id)` | `string` | | O id pelo qual os testes de UI encontram a scroll view da lista (`id:` de `nsh test`, XCUITest, UI Automator). |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | A ref da lista (veja [métodos de ref](#ref-methods)). |

As listas também aceitam as props de rolagem de [`Scroll`](./scroll.md#scrolling) (os métodos de `Scrollable` em Rust): `pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `disableIntervalMomentum`, `decelerationRate`, `bounces`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `scrollEventThrottle` e `scrollable`. As listas mantêm sua escala.

As props que todo elemento aceita ([props comuns](./index.md#common-props)) vão para a scroll view da lista como estão: `testID`, `accessibilityLabel` e as demais props de acessibilidade, os estilos, `onLayout`, e as props de toque e de responder. Os testes de UI encontram uma lista pelo seu `testID` como qualquer outra view.

`ViewabilityConfig` (Rust: `Viewability { item_visible_threshold, view_area_coverage_threshold }` e `.minimum_view_time(..)`):

| Campo | Tipo | Descrição |
|---|---|---|
| `itemVisibleThreshold` | `number` | Quanto de um item deve estar visível, de 0 a 1. |
| `viewAreaCoverageThreshold` | `number` | Quanto da viewport um item deve cobrir, de 0 a 1. Sem nenhum dos limites, qualquer pixel visível conta. |
| `minimumViewTime` | `number` | Milissegundos em que os itens devem permanecer visíveis antes de serem reportados. |

`ViewToken<T>` é `{ item, key, index, isViewable }`. O listener do Rust recebe `ViewableItems`: `indices()` é o intervalo de linhas visíveis e `changed()` são as linhas que entraram ou saíram.

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | O offset mudou. |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | O arrasto começou / terminou. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Um deslizamento começou / terminou. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | A rolagem parou. |
| `onLoadMore` | `.on_load_more` | nenhum | A até `loadMoreThreshold` viewports do fim. |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | nenhum | A até `loadMoreAtStartThreshold` viewports do início, uma vez por aproximação após uma rolagem. |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }` (`ViewableItems`) | A visibilidade mudou. |
| `onRefresh` | `.on_refresh` | nenhum | Puxado para atualizar. |

<a id="ref-methods"></a>

## Métodos de ref

| Método | Rust | Descrição |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | Rola o item `index` para dentro da área visível. `viewPosition` o posiciona: 0 no início da viewport (padrão), 0.5 no meio, 1 no fim; `viewOffset` o desloca ainda mais. Resolvido nativamente com os tamanhos atuais dos itens (medidos ou estimados). |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | Rola até um offset ao longo do eixo da lista. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | Rola até o fim do conteúdo (o início de uma lista invertida). |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | Rola até um offset. |

<a id="examples"></a>

## Exemplos

Uma grade com cabeçalho e visibilidade:

```rust tabs
let visible = signal(SharedString::default());
let list = element_ref();

virtual_list(move || photos.with(|p| p.len()), move |at| {
    image(move || photos.with(|p| p[at.index()].url.clone())).h(px(120.0)).rounded(px(8.0))
})
.element_ref(&list)
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.viewability(Viewability { item_visible_threshold: Some(Percentage(0.5)), ..Viewability::default() })
.on_viewable_items_change(move |items: &ViewableItems| {
    visible.set(format!("{} visible", items.indices().count()).into())
})
.header(
    text("Jump to 60")
        .on_press(move || list.scroll_to_index(60, percentage(0.5), px(0.0), true)),
)
.flex_1()
```

```tsx tabs
const visible = signal("");
let list!: ListRef;

<List
  ref={list}
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  contentStyle={{ padding: 12, gap: 8 }}
  viewabilityConfig={{ itemVisibleThreshold: 0.5 }}
  onViewableItemsChange={({ viewableItems }) => visible.set(`${viewableItems.length} visible`)}
  header={<Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>}
  style={{ flex: 1 }}
>
  {(photo) => <Image src={photo().url} style={{ height: 120, borderRadius: 8 }} />}
</List>;
```

Um chat:

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(64.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .flex_1()
```

```tsx tabs
<List each={messages()} inverted estimatedItemSize={64} keyboardDismissMode="interactive" style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

O item 0 é a mensagem mais recente, desenhada na parte inferior; novas mensagens adicionadas no início dos itens aparecem sem mover o que o usuário está lendo.

<a id="platform-notes"></a>

## Notas de plataforma

- Inserir itens acima das linhas visíveis mantém as linhas visíveis no lugar em ambas as plataformas.
- Listas horizontais em layouts da direita para a esquerda são espelhadas nativamente.
- Os cabeçalhos fixos são afixados nativamente a cada frame de rolagem.
