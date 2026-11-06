---
title: "List"
description: "List, uma lista virtualizada e com reciclagem em uma scroll view nativa, com todas as suas props, eventos e métodos de ref."
order: 2.1
source_hash: 6aa08fac2fd24e8c
---


# List

`nsh` exporta `List`: uma lista virtualizada sobre uma scroll view nativa. Apenas as linhas próximas da viewport existem, e suas células são reutilizadas conforme você rola. Quais linhas existem, onde estão, colunas, cabeçalhos fixos e visibilidade são todos calculados nativamente, de modo que rolar uma lista com dez mil itens não executa nenhum JS, exceto os bindings das linhas que mudam quando uma célula é reutilizada.

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

Veja [Listas](../docs/lists.md) para o guia e [`<List>`](../elements/list.md) para as props do elemento.

## List

```ts
function List<T>(props: ListProps<T>): JSX.Element;
```

```tsx
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Contact ${i}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={48} style={{ flex: 1 }}>
      {(item, index) => (
        <View style={{ height: 48, paddingHorizontal: 16, justifyContent: "center", backgroundColor: index() % 2 ? "#f8fafc" : "#fff" }}>
          <Text>{item().name}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

<a id="rows-are-recycled"></a>

### As linhas são recicladas

`children` é uma função que renderiza **uma célula**. Ela é executada uma vez por célula, não uma vez por item: quando uma célula sai da área visível, ela é reutilizada para outro item, e `item()` e `index()` (ambos accessors) mudam. Leia-os dentro de expressões JSX (`{item().name}`) para que a célula seja atualizada quando for reutilizada.

> [!WARNING]
> Não mantenha estado por item em signals criados dentro da função da linha: a célula é reutilizada para outros itens e o signal acompanharia a célula, não o item. Mantenha o estado nos seus dados, indexado por id (por exemplo, um signal contendo um `Set` de ids selecionados).

## Props

`ListProps<T>` combina as props próprias da lista com as props de rolagem compartilhadas com `<Scroll>` e as props que todo elemento aceita, que são repassadas à scroll view da lista.

<a id="data-and-rendering"></a>

### Dados e renderização

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `each` | `readonly T[]` | (obrigatório) | Os itens. Passe o valor de um signal (`each={items()}`) para acompanhar as mudanças; inserir itens acima das linhas visíveis mantém essas linhas no lugar. |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (obrigatório) | Renderiza uma linha (veja acima). |
| `estimatedItemSize` | `number` | `50` | O tamanho das linhas ainda não medidas, em pontos, ao longo do eixo da lista. Estimativas próximas tornam o indicador de rolagem e `scrollToIndex` mais precisos. |
| `numColumns` | `number` | `1` | Itens por linha (listas verticais): uma grade. |
| `horizontal` | `boolean` | `false` | Rola na horizontal. |
| `inverted` | `boolean` | `false` | Faz o layout a partir do fim, com o item 0 por último (estilo chat); começa rolada até o fim e mantém sua distância do fim conforme o conteúdo muda. |
| `stickyHeaderIndices` | `number[]` | | Itens que ficam fixos no início enquanto a rolagem passa por eles (uma coluna, não invertida). |
| `header` | `ListSlot` | | Renderizado antes dos itens. |
| `footer` | `ListSlot` | | Renderizado depois dos itens. |
| `empty` | `ListSlot` | | Exibido no lugar dos itens enquanto `each` estiver vazio. |
| `separator` | `ListSlot` | | Renderizado entre os itens (uma coluna). |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`, `item.id` ou o índice | A chave de um item nos tokens de visibilidade. |
| `initialScrollIndex` | `number` | | Rola até este item antes do primeiro frame. |
| `contentStyle` | `ListContentStyle` | | Padding e espaçamentos do conteúdo: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap` (números). |
| `contentClass` | `string` | | Padding e espaçamentos do conteúdo como classes (`p-*`, `gap-*`); `contentStyle` tem precedência sobre elas. |
| `style` | `StyleProp<ViewStyle>` | | O estilo próprio da lista (defina um tamanho: `flex: 1` ou uma altura). |
| `testID` | `string` | | O id pelo qual os testes de UI encontram a scroll view da lista (`id:` de `nsh test`, XCUITest, UI Automator). |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | Veja [métodos de ref](#ref-methods). |

`ListSlot` é um componente (`Header`) ou um elemento (`<Header />`).

<a id="loading-refreshing-and-viewability"></a>

### Carregamento, atualização e visibilidade

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `onLoadMore` | `() => void` | | Chamado quando o fim está a `loadMoreThreshold` viewports de distância: carrega mais. |
| `loadMoreThreshold` | `number` | `1` | A que distância do fim (em comprimentos de viewport) `onLoadMore` é disparado. |
| `onLoadMoreAtStart` | `() => void` | | Chamado quando o início está a `loadMoreAtStartThreshold` viewports de distância depois que o usuário ou um comando de rolagem moveu a lista: carrega o que vem antes do primeiro item. |
| `loadMoreAtStartThreshold` | `number` | `1` | A que distância do início (em comprimentos de viewport) `onLoadMoreAtStart` é disparado. |
| `refreshing` | `boolean` | | O spinner de pull-to-refresh é exibido. |
| `onRefresh` | `() => void` | | Habilita o pull to refresh; defina `refreshing` enquanto carrega. |
| `refreshIndicator` | `{ height: number }` | | O app desenha seu próprio indicador de pull-to-refresh, com `height` de altura, no lugar do spinner. |
| `pullValue` | `AnimatedValue` | | Recebe o quanto a lista foi puxada além do topo, para esse indicador. |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Itens que passaram a ser visíveis ou deixaram de ser. |
| `viewabilityConfig` | `ViewabilityConfig` | | Quando um item é considerado visível. |

```ts
interface ViewToken<T> {
  item: T;
  key: string;
  index: number;
  isViewable: boolean;
}

interface ViewabilityConfig {
  /** How much of the viewport an item must cover to count as viewable, from 0 to 1. */
  viewAreaCoverageThreshold?: number;
  /** How much of an item must be visible, from 0 to 1. Without either threshold, any visible pixel counts. */
  itemVisibleThreshold?: number;
  /** Milliseconds items must stay viewable before they are reported. */
  minimumViewTime?: number;
}
```

<a id="scrolling"></a>

### Rolagem

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | O indicador de rolagem é exibido: o da plataforma ou a [barra integrada](../elements/scrollbar.md#built-in-bars) do app; um objeto é um tema da própria view. |
| `scrollable` | `boolean` | `true` | O usuário pode rolar. |
| `bounces` | `boolean` | `true` | Overscroll além das bordas. |
| `pagingEnabled` | `boolean` | `false` | Para em múltiplos da viewport. |
| `snapToInterval` | `number` | `0` | Para em múltiplos deste comprimento (0: desligado). |
| `snapToOffsets` | `number[]` | | Para nestes offsets. |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | Qual ponto de um item se alinha com a viewport com `snapToInterval`. |
| `disableIntervalMomentum` | `boolean` | `false` | Um fling move no máximo um ponto de parada. |
| `decelerationRate` | `"normal" \| "fast" \| number` | plataforma | Quão rápido um fling desacelera (`0.998` / `0.99`, ou a velocidade mantida por milissegundo). |
| `contentInset` | `Partial<Edges>` | | Espaço ao redor do conteúdo. |
| `contentOffset` | `{ x?, y? }` | | Onde ela começa. |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Se um toque dispensa o teclado (`"never"`: o toque apenas o dispensa). |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Se arrastar dispensa o teclado. |
| `scrollEventThrottle` | `number` | | Mínimo de milissegundos entre eventos `onScroll` (de qualquer forma, no máximo um por frame). |
| `scrollValue` | `AnimatedValue` | | Um [valor animado](./nsh.md#animation) alimentado com o offset de rolagem (eixo principal) na UI thread, para efeitos vinculados à rolagem. |

<a id="scroll-events"></a>

### Eventos de rolagem

| Evento | Payload | Quando |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | Durante a rolagem. |
| `onScrollDragStart` | `{ offset }` | Um arrasto começa. |
| `onScrollDragEnd` | `{ offset }` | O dedo é levantado. |
| `onMomentumStart` | `{ offset }` | Um deslizamento começa após o arrasto. |
| `onMomentumEnd` | `{ offset }` | O deslizamento termina (também quando um novo arrasto o interrompe). |
| `onScrollEnd` | `{ offset }` | A rolagem parou. |

As listas também aceitam as props que todo elemento aceita ([props comuns](../elements/index.md)).

<a id="ref-methods"></a>

## Métodos de ref

O `ref` de uma lista recebe um `ListRef`, com estes métodos além dos de `ViewRef`:

| Método | Descrição |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Rola o item `index` até a área visível. `viewPosition` o posiciona: `0` no início da viewport (padrão), `0.5` no meio, `1` no fim; `viewOffset` o desloca ainda mais. Resolvido nativamente com os tamanhos de linha medidos (ou estimados). |
| `scrollToOffset({ offset, animated? })` | Rola até um offset do conteúdo ao longo do eixo da lista. |
| `scrollToEnd({ animated? })` | Rola até o fim do conteúdo (o início de uma lista invertida). |
| `scrollTo({ x?, y?, animated? })` | Rola até um offset. |

```tsx
import { List, type ListRef, Text, View } from "nsh";

let list!: ListRef;

<View style={{ flex: 1 }}>
  <Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>
  <List ref={list} each={items} numColumns={3} estimatedItemSize={90} style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 8 }}>
    {(item) => <View style={{ height: 90, backgroundColor: "#e0e7ff" }}><Text>{item().title}</Text></View>}
  </List>
</View>
```

<a id="examples"></a>

## Exemplos

Um chat: mensagem mais recente na parte inferior, mensagens mais antigas carregadas conforme você rola para cima.

```tsx
<List
  each={messages()}
  inverted
  estimatedItemSize={44}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 6 }}
  keyboardDismissMode="interactive"
  onLoadMore={loadOlder}
  loadMoreThreshold={0.5}
>
  {(m) => (
    <View style={{ alignSelf: m().mine ? "flex-end" : "flex-start", maxWidth: "75%", padding: 10, borderRadius: 14, backgroundColor: m().mine ? "#6366f1" : "#e2e8f0" }}>
      <Text style={{ color: m().mine ? "#fff" : "#0f172a" }}>{m().text}</Text>
    </View>
  )}
</List>
```

Pull to refresh:

```tsx
const refreshing = signal(false);
const refresh = async () => {
  refreshing.set(true);
  items.set(await load());
  refreshing.set(false);
};

<List each={items()} refreshing={refreshing()} onRefresh={refresh} style={{ flex: 1 }}>
  {(item) => <Text style={{ padding: 16 }}>{item().title}</Text>}
</List>
```

## ListItemsProps

```ts
type ListItemsProps<T> = Pick<ListProps<T>,
  "each" | "children" | "keyExtractor" | "stickyHeaderIndices" | "initialScrollIndex"
  | "onViewableItemsChange" | "viewabilityConfig" | "refreshing" | "onRefresh"
  | "onLoadMore" | "loadMoreThreshold"
  | "header" | "footer" | "empty">;
```

A metade de dados e linhas de `ListProps`: o que você passa a um componente seu que faz o layout de uma lista por conta própria, como uma lista de configurações que envolve `List` com seu próprio padding e divisores.
