---
title: "Listas"
description: "Listas longas e infinitas em Rust e TSX - reciclagem, identidade de linha, colunas, cabeçalhos fixos, listas de chat invertidas, listas horizontais, listas em uma página, carregamento de mais itens, visibilidade e rolagem até um item."
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---


# Listas

A lista (`virtual_list(..)` em Rust, `List` de `nsh` em TSX) renderiza dados longos em uma scroll view nativa, criando apenas as linhas próximas à tela. Quais linhas existem, onde ficam, as colunas, os cabeçalhos fixos e quais itens estão visíveis são todos calculados nativamente; seu código só preenche as células com conteúdo quando o lado nativo pede uma. Uma lista de um milhão de itens custa quase o mesmo que uma lista de trinta.

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let titles: Rc<Vec<String>> = Rc::new((1..=10_000).map(|i| format!("Item {i}")).collect());
    virtual_list(titles.len(), move |at| {
        let titles = titles.clone();
        view()
            .p_4()
            .border_b_1()
            .border_b_color(rgb(0xeaeef2))
            .child(text(move || titles[at.index()].clone()).text_size(px(16.0)))
    })
    .estimated_item_size(px(52.0))
    .flex_1()
    .bg(white())
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: i, title: `Item ${i + 1}` }));

function App() {
  return (
    <List each={items} estimatedItemSize={52} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {(item) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eaeef2" }}>
          <Text style={{ fontSize: 16 }}>{item().title}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

Em Rust, `virtual_list(count, row)` recebe o número de linhas (um valor, um signal ou uma closure) e uma função que constrói uma linha a partir de sua posição (`at.index()`); as linhas leem seus dados por esse índice. Em TSX, `each` recebe os itens e a função de linha recebe o item. Como uma [scroll view](./scrolling.md), a lista é a viewport e precisa de um tamanho vindo do pai (`.flex_1()`, `flex: 1` ou uma altura).

<a id="how-recycling-works"></a>

## Como a reciclagem funciona

A função de linha não é chamada uma vez por item. Ela é chamada **uma vez por célula**, e as células são reutilizadas: quando uma linha rola para muito longe da tela, sua célula recebe outra linha, e a posição dela (`at.index()` em Rust, `item()` e `index()` em TSX) muda. Tudo na linha que lê essa posição é atualizado no lugar, como qualquer outro [signal](./reactivity.md).

Duas regras decorrem disso:

**Leia a posição onde você a usa.** Um valor copiado no início da função de linha pertence à linha que a célula mostrou primeiro.

```rust tabs
// Wrong: `title` stays the first row's title when the cell is reused.
virtual_list(count, move |at| {
    let title = titles[at.index()].clone();
    text(title)
})

// Right: the text follows the cell's current row.
virtual_list(count, move |at| {
    let titles = titles.clone();
    text(move || titles[at.index()].clone())
})
```

```tsx tabs
// Wrong: `title` stays the first item's title when the cell is reused.
{(item) => {
  const title = item().title;
  return <Text>{title}</Text>;
}}

// Right: the text follows the cell's current item.
{(item) => <Text>{item().title}</Text>}
```

**Mantenha o estado de cada item nos seus dados, não na linha.** Um signal criado dentro da linha pertence à célula e vai com ela para o próximo item. Guarde "esta linha está expandida / selecionada / curtida" nos itens ou em um conjunto indexado por id:

```rust tabs
let liked = signal(HashSet::<u32>::new());
let toggle = move |id: u32| {
    liked.update(|s| {
        if !s.remove(&id) {
            s.insert(id);
        }
    })
};

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
.flex_1()
```

```tsx tabs
const liked = signal<Set<number>>(new Set());
const toggle = (id: number) =>
  liked.update((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

<List each={posts()} estimatedItemSize={64} style={{ flex: 1 }}>
  {(post) => (
    <View style={{ flexDirection: "row", padding: 16 }}>
      <Text style={{ flex: 1 }}>{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

As linhas podem ter alturas diferentes. Até que uma linha seja medida, a lista assume o tamanho estimado de item (padrão de 50 pontos); passe um valor próximo da sua linha típica para que o indicador de rolagem e os saltos para itens distantes sejam precisos desde o início.

<a id="changing-the-data"></a>

## Alterando os dados

Em Rust, informe a contagem como um signal ou uma closure (`move || posts.with(Vec::len)`): a lista cresce e diminui no lugar. Linhas adicionadas ou removidas no final não exigem mais nada; quando linhas entram e saem em outros pontos, informe as identidades delas com `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))`, e a lista mantém o início e o fim em comum e trata o que está entre eles como removido e inserido.

Em TSX, passe um novo array para alterar os itens: `posts.set([...posts(), ...more])`. A lista compara o array antigo e o novo **por identidade do item** (`===`), mantém o início e o fim em comum e trata o que está entre eles como removido e inserido.

Em ambos, as medições permanecem com suas linhas e, quando linhas são inseridas acima das linhas na tela, as linhas visíveis ficam onde estão em vez de saltar.

- Em TSX, atualize de forma imutável: um novo array, reaproveitando os objetos de item que não mudaram. Alterar o array no lugar (`push`) não é detectado.
- Um item alterado deve ser um novo objeto (`{ ...post, title }`), para que sua linha mostre a mudança.
- Inserir no início (novas mensagens, um feed atualizado) mantém o lugar do usuário.

`keyExtractor` nomeia os itens nos tokens de visibilidade (abaixo); por padrão a chave é `item.key`, depois `item.id` e depois o índice. Ela não afeta como as mudanças são associadas em TSX, que é sempre por identidade.

## Props

Uma lista aceita todas as props de rolagem da scroll view que fazem sentido para uma lista (`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `decelerationRate`, `disableIntervalMomentum`, `bounces`, `scrollable`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `keyboardDismissMode`, `scrollEventThrottle`, `onScroll`, `onScrollDragStart`, `onScrollDragEnd`, `onMomentumStart`, `onMomentumEnd`, `onScrollEnd`, `scrollValue`, `pullValue`; em Rust, os mesmos métodos de uma scroll view), descritas em [Rolagem](./scrolling.md). As listas mantêm escala 1. Props próprias:

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Os itens; em Rust, o número de linhas. |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | Renderiza uma célula; chamada uma vez por célula, veja [reciclagem](#how-recycling-works). |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | O tamanho das linhas ainda não medidas, em pontos. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Rola lateralmente. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: a lista rola em uma scroll view própria. `"parent"`: ela se estende por todo o seu comprimento na scroll view ao redor, que a rola junto com o resto da página (veja [listas em uma página](#lists-in-a-page-viewportparent)). Escolhida quando a lista é criada. |
| `numColumns` | `.columns(n)` | `number` | `1` | Itens por linha (listas verticais). |
| `inverted` | `.inverted()` | `boolean` | `false` | Item 0 na parte inferior (chat); começa no final e mantém sua distância do final. |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | Uma lista não invertida permanece no final enquanto estiver a até essa quantidade de pontos dele, conforme o conteúdo cresce (veja abaixo). |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | Itens que ficam fixos no topo depois de rolados para além dele (uma coluna, não invertida). |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`, `.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | A que distância abaixo do topo os itens fixos ficam presos, como o `top` do CSS `position: sticky`; o conteúdo continua rolando sob o espaço acima deles. Um valor animado os move a cada frame. |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, ..., `.row_gap(..)`, `.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | Padding e gaps do conteúdo, apenas números. |
| `contentClass` | | `string` | | O mesmo que as classes (`p-*`, `gap-*`); `contentStyle` tem precedência sobre elas. |
| `header` | `.header(..)` | componente ou elemento | | Antes dos itens. |
| `footer` | `.footer(..)` | componente ou elemento | | Depois dos itens. |
| `empty` | `.empty(..)` | componente ou elemento | | Mostrado no lugar dos itens enquanto não houver nenhum. |
| `separator` | `.separator(\|\| ..)` | componente ou elemento | | Entre os itens (uma coluna). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Rola até este item antes do primeiro frame. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | O final está próximo (veja abaixo). |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | A que distância do final, em viewports, `onLoadMore` é disparado. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | O início está próximo, após uma rolagem (veja abaixo). |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | A que distância do início, em viewports, `onLoadMoreAtStart` é disparado. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | Itens se tornaram visíveis ou deixaram de ser. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Quando os itens são considerados visíveis. |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | A chave nos tokens de visibilidade; em Rust, as identidades das linhas. |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | Puxar para atualizar. |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | O indicador próprio do app para puxar para atualizar, no lugar do spinner da plataforma (veja [Rolagem](./scrolling.md#an-indicator-of-your-own)). |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | O indicador de rolagem é exibido: o da plataforma ou a [barra integrada](../elements/scrollbar.md#built-in-bars) do app, uma vez que ele defina um tema; um objeto é um tema próprio da view. No desktop e em navegadores desktop, uma view horizontal o mantém: ele é a barra de rolagem do mouse. |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`, `scrollToOffset`, `scrollToEnd`, `scrollTo`. |

Os slots de cabeçalho, rodapé e vazio aceitam um elemento (em TSX, também um componente: `header={Header}`). Eles são células próprias, nunca recicladas, e são reativos como qualquer outro elemento.

<a id="columns-and-grids"></a>

## Colunas e grades

`numColumns` (`.columns(n)`) distribui os itens em linhas com esse número de colunas; o padding do conteúdo fica ao redor do conteúdo, com gaps entre linhas e colunas. As linhas de uma grade podem ter alturas diferentes: cada linha tem a altura do seu item mais alto.

```rust tabs
let count = photos.len();
virtual_list(count, move |at| {
    let photos = photos.clone();
    image(move || photos[at.index()].thumb.clone()).aspect_square().rounded(px(8.0))
})
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.flex_1()
```

```tsx tabs
<List
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 8 }}
>
  {(photo) => <Image src={photo().thumb} style={{ aspectRatio: 1, borderRadius: 8 }} />}
</List>
```

<a id="sticky-headers"></a>

## Cabeçalhos fixos

`stickyHeaderIndices` lista os itens que ficam fixos no topo da viewport enquanto o conteúdo rola por eles, até que o próximo item fixo os empurre para fora. As seções são uma única lista de itens de cabeçalho e de linha; os índices dos cabeçalhos ficam fixos. A fixação é feita nativamente a cada frame de rolagem.

```rust tabs
#[derive(Clone, PartialEq)]
enum Row {
    Header(String),
    Name(String),
}

let mut rows = Vec::new();
let mut headers = Vec::new();
for (letter, names) in groups {
    headers.push(rows.len());
    rows.push(Row::Header(letter));
    rows.extend(names.into_iter().map(Row::Name));
}
let count = rows.len();
let rows = Rc::new(rows);

virtual_list(count, move |at| {
    let rows = rows.clone();
    let row = computed(move || rows[at.index()].clone());
    let is_header = computed(move || matches!(row.get(), Row::Header(_)));
    let label = move || match row.get() {
        Row::Header(s) | Row::Name(s) => s,
    };
    when(is_header, move || {
        text(label).p(px(6.0)).bg(rgb(0xeaeef2)).font_weight(FontWeight::BOLD)
    })
    .otherwise(move || text(label).p_3())
})
.sticky_header_indices(headers)
.estimated_item_size(px(44.0))
.flex_1()
```

```tsx tabs
type Row = { header: string } | { name: string };

const rows: Row[] = [];
const headers: number[] = [];
for (const [letter, names] of groups) {
  headers.push(rows.length);
  rows.push({ header: letter });
  for (const name of names) rows.push({ name });
}

<List each={rows} stickyHeaderIndices={headers} estimatedItemSize={44} style={{ flex: 1 }}>
  {(row) => (
    <If
      when={"header" in row()}
      else={<Text style={{ padding: 12 }}>{(row() as { name: string }).name}</Text>}
    >
      <Text style={{ padding: 6, backgroundColor: "#eaeef2", fontWeight: "700" }}>{(row() as { header: string }).header}</Text>
    </If>
  )}
</List>
```

Como uma célula pode mostrar um cabeçalho agora e um nome depois, a linha decide o que renderizar com [`when` / `<If>`](../elements/control-flow.md), que alterna quando a linha muda. Cabeçalhos fixos exigem uma coluna e uma lista não invertida.

`stickyHeaderOffset` (`.sticky_header_offset(..)` em Rust) faz os cabeçalhos ficarem fixos essa quantidade de pontos abaixo do topo, como o `top` do CSS `position: sticky`: sob uma barra translúcida de 56 pontos de altura, `stickyHeaderOffset={56}` (`.sticky_header_offset(px(56.0))`) mantém cada cabeçalho abaixo da barra enquanto as linhas continuam rolando sob ela, e o próximo cabeçalho o empurra para fora a partir dali. Um offset negativo deixa parte de um cabeçalho fora de vista.

O offset pode ser um [valor animado](./animation.md#animated-values) (`.bind_sticky_header_offset(&node)` em Rust): os cabeçalhos o seguem a cada frame na thread de UI, de modo que permanecem abaixo de uma barra que se move. Com uma barra que se esconde quando o conteúdo rola para baixo e volta quando ele rola para cima ([`diffClamp`](./animation.md#arithmetic-and-diffclamp)), os cabeçalhos ficam fixos na borda inferior dela, onde quer que ela esteja:

```rust tabs
let offset = animated_value(0.0);
let hidden = offset.diff_clamp(0.0, 56.0);
let shown = hidden.mul(-1.0).add(56.0);

view().flex_1().overflow_hidden().child(
    virtual_list(rows.len(), row)
        .scroll_value(&offset)
        .sticky_header_indices(headers)
        .bind_sticky_header_offset(&shown),
).child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&hidden.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const hidden = scroll.diffClamp(0, 56);
const shown = hidden.mul(-1).add(56);

<View style={{ flex: 1, overflow: "hidden" }}>
  <List each={rows} scrollValue={scroll} stickyHeaderIndices={headers} stickyHeaderOffset={shown}>…</List>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, hidden.mul(-1)] }}>…</View>
</View>
```

<a id="chat-inverted-lists"></a>

## Chat: listas invertidas

`inverted` organiza a lista a partir do final: o item 0 fica na parte inferior, a lista começa rolada até o final e mantém sua distância do final conforme os itens mudam. Mantenha a mensagem mais recente primeiro; insira no início para adicionar uma e acrescente no fim para carregar as mais antigas com `onLoadMore` (o "final" de uma lista invertida é o topo). Um chat aberto em uma mensagem antiga carrega as mais novas com [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart); com ele, a lista mantém sua distância da parte inferior enquanto estiver lá e mantém no lugar as mensagens na tela quando rolada para cima.

```rust tabs
#[derive(Clone, PartialEq)]
struct Message {
    id: u32,
    text: String,
    mine: bool,
}

pub fn chat() -> impl IntoElement {
    let next = stored(0_u32);
    let message = move |text: String, mine: bool| Message {
        id: next.with(|n| {
            *n += 1;
            *n
        }),
        text,
        mine,
    };
    // Newest first.
    let messages = signal(
        (0..30)
            .map(|i| message(format!("Message {}", 30 - i), i % 3 == 0))
            .collect::<Vec<_>>(),
    );
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get_untracked();
        if text.trim().is_empty() {
            return;
        }
        let sent = message(text, true);
        messages.update(|m| m.insert(0, sent));
        draft.set(String::new());
    };
    let load_older = move || {
        let older: Vec<_> = (0..20).map(|i| message(format!("Older {i}"), false)).collect();
        messages.update(|m| m.extend(older));
    };
    let list = virtual_list(
        move || messages.with(Vec::len),
        move |at| {
            let mine = computed(move || messages.with(|m| m[at.index()].mine));
            view()
                .style_when(mine, |s| s.self_end().bg(rgb(0x0969da)))
                .style_when(move || !mine.get(), |s| s.self_start().bg(rgb(0xeaeef2)))
                .max_w(relative(0.75))
                .px_3()
                .py_2()
                .rounded(px(14.0))
                .child(
                    text(move || messages.with(|m| m[at.index()].text.clone()))
                        .text_color(move || if mine.get() { rgb(0xffffff) } else { rgb(0x1f2328) }),
                )
        },
    )
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(44.0))
    .content_padding(px(12.0))
    .row_gap(px(6.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .on_load_more(load_older)
    .load_more_threshold(0.5)
    .flex_1();
    view()
        .flex_1()
        .pb_keyboard()
        .child(list)
        .child(
            view().flex_row().gap_2().p_2().child(
                input()
                    .value(move || draft.get())
                    .on_change(move |text: &str| draft.set(text.to_owned()))
                    .on_submit(move |_: &str| send())
                    .multiline(true)
                    .submit_behavior(SubmitBehavior::Submit)
                    .return_key_type(ReturnKeyType::Send)
                    .placeholder("Message")
                    .flex_1()
                    .max_h(px(120.0))
                    .border_1()
                    .border_color(rgb(0xd0d7de))
                    .rounded(px(18.0))
                    .px_3()
                    .py_2(),
            ),
        )
}
```

```tsx tabs
import { List, mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

type Message = { id: number; text: string; mine: boolean };

function Chat() {
  let next = 0;
  const message = (text: string, mine: boolean): Message => ({ id: next++, text, mine });
  const messages = signal(Array.from({ length: 30 }, (_, i) => message(`Message ${30 - i}`, i % 3 === 0)));
  const draft = signal("");
  const send = () => {
    if (!draft().trim()) return;
    messages.update((m) => [message(draft(), true), ...m]); // newest first
    draft.set("");
  };
  const loadOlder = () => messages.update((m) => [...m, ...Array.from({ length: 20 }, (_, i) => message(`Older ${i}`, false))]);
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
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
          <View
            style={{
              alignSelf: m().mine ? "flex-end" : "flex-start",
              maxWidth: "75%",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: m().mine ? "#0969da" : "#eaeef2",
            }}
          >
            <Text style={{ color: m().mine ? "#ffffff" : "#1f2328" }}>{m().text}</Text>
          </View>
        )}
      </List>
      <View style={{ flexDirection: "row", gap: 8, padding: 8 }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          onSubmit={send}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}
        />
      </View>
    </View>
  );
}

mount(Chat);
```

`scroll_to_end(..)` / `scrollToEnd()` em uma lista invertida rola até o início dela: a mensagem mais recente.

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### Acompanhando o final de uma lista não invertida

Uma lista em ordem de leitura (mais antigo primeiro) também pode acompanhar o seu final: com `.follow_end(px(40.0))` em Rust ou `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}` em TSX, enquanto o usuário está no final (ou a até 40 pontos dele), a lista permanece no final conforme o conteúdo cresce: uma resposta sendo transmitida para o último item, uma nova mensagem acrescentada, o teclado reduzindo a lista. Quando rolada mais para cima, o conteúdo visível permanece onde está e o novo conteúdo cresce abaixo dele. Itens inseridos acima dos visíveis nunca os movem, com ou sem a opção.

```rust tabs
virtual_list(move || messages.with(Vec::len), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .follow_end(px(40.0))
    .flex_1()
```

```tsx tabs
<List each={messages()} keyExtractor={(m) => m.id} maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }} style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

<a id="horizontal-lists"></a>

## Listas horizontais

`horizontal` vira a lista de lado; as células são organizadas na altura da lista. Combinada com snapping, forma um carrossel de qualquer comprimento:

```rust tabs
let count = cards.len();
virtual_list(count, move |at| {
    let cards = cards.clone();
    view()
        .w(px(220.0))
        .h(px(140.0))
        .rounded(px(14.0))
        .bg(move || cards[at.index()].color)
})
.horizontal()
.estimated_item_size(px(232.0))
.snap_interval(px(232.0))
.deceleration(0.99)
.scrollbar(false)
.content_padding_x(px(16.0))
.column_gap(px(12.0))
.h(px(140.0))
```

```tsx tabs
<List
  each={cards}
  horizontal
  estimatedItemSize={232}
  snapToInterval={232}
  decelerationRate="fast"
  scrollbar={false}
  style={{ height: 140 }}
  contentStyle={{ paddingHorizontal: 16, gap: 12 }}
>
  {(card) => <View style={{ width: 220, height: 140, borderRadius: 14, backgroundColor: card().color }} />}
</List>
```

Em leitura da direita para a esquerda, as listas horizontais começam na direita e seguem para a esquerda.

<a id="lists-in-a-page-viewportparent"></a>

## Listas em uma página: viewport="parent"

Muitas vezes uma página rola como um todo: um cabeçalho, alguns cards, depois uma lista longa e talvez outra lista abaixo dela. Dê à lista `viewport="parent"` (`.viewport(ListViewport::Parent)` em Rust) e coloque-a em uma `Scroll` com o resto da página: a lista se estende na página por todo o seu comprimento, e a scroll view da página a rola junto com todo o resto. Ela ainda cria apenas as linhas próximas à viewport da página e recicla suas células, então uma única página pode conter várias listas longas.

```rust tabs
scroll()
    .flex_1()
    .child(header())
    .child(
        virtual_list(count, row)
            .viewport(ListViewport::Parent)
            .estimated_item_size(px(56.0))
            .row_gap(px(6.0)),
    )
    .child(footer())
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <Header />
  <List viewport="parent" each={items} estimatedItemSize={56} contentStyle={{ gap: 6 }}>
    {(item) => <Row item={item()} />}
  </List>
  <Footer />
</Scroll>
```

- A lista tem o comprimento de suas linhas: sua altura (sua largura, no caso lateral) vem do seu conteúdo, como a de uma view, e seu padding, borda e margens funcionam como em uma view.
- Suas linhas seguem a scroll view mais próxima ao redor, ao longo do seu eixo, ou a tela em que ela está.
- A página mantém no lugar o que você está lendo, como um navegador faz: linhas que mudam de tamanho totalmente acima do topo da viewport movem a página na mesma medida; enquanto o início da lista está à vista, linhas que crescem empurram para baixo o que está abaixo delas.
- `scrollToIndex`, `scrollToEnd` e `initialScrollIndex` rolam a página até as linhas da lista, dentro do conteúdo da página; `onLoadMore` é disparado quando o final da lista se aproxima da viewport, e `onViewableItemsChange` informa as linhas na viewport da página.
- `stickyHeaderIndices` e `stickyHeaderOffset` fixam linhas no topo da página: um cabeçalho de seção permanece no topo enquanto suas linhas rolam sob ele, até que o próximo o empurre para fora, e o último sai junto com o final da sua lista.
- Como a página rola é definido pela sua scroll view: defina `onScroll` e os demais eventos de rolagem, `scrollValue`, `refreshing` / `onRefresh`, paginação e snapping, `contentInset`, `scrollbar`, `scrollable` e `keyboardDismissMode` na `Scroll`. Listas invertidas e `maintainVisibleContentPosition` são recursos de uma lista com viewport própria (`viewport="own"`, o padrão).
- A viewport é escolhida quando a lista é criada: para trocá-la, renderize uma nova lista.

<a id="loading-more-onloadmore"></a>

## Carregando mais: onLoadMore

`onLoadMore` (`.on_load_more(..)`) é disparado quando a viewport chega a `loadMoreThreshold` viewports do final (1 por padrão: uma tela à frente). Acrescente a próxima página; a lista dispara novamente quando o novo final se aproxima.

```rust tabs
let posts = signal(Vec::<Post>::new());
let page = stored(0_u32);
let loading = stored(false);

let load_more = move || {
    if loading.replace(true) {
        return;
    }
    let next = page.with(|p| {
        *p += 1;
        *p
    });
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/posts?page={next}")).await {
            let more = parse_posts(&response.text());
            posts.update(|p| p.extend(more));
        }
        loading.replace(false);
    });
};
load_more();

virtual_list(move || posts.with(Vec::len), move |at| post_row(posts, at))
    .estimated_item_size(px(72.0))
    .on_load_more(load_more)
    .load_more_threshold(0.5)
    .footer(text("Loading…").p_4().text_center().text_color(rgb(0x8c959f)))
    .flex_1()
```

```tsx tabs
const posts = signal<Post[]>([]);
let loading = false;
let page = 0;

const loadMore = async () => {
  if (loading) return;
  loading = true;
  try {
    const next: Post[] = await (await fetch(`https://api.example.com/posts?page=${++page}`)).json();
    posts.set([...posts(), ...next]);
  } finally {
    loading = false;
  }
};
loadMore();

<List
  each={posts()}
  estimatedItemSize={72}
  style={{ flex: 1 }}
  onLoadMore={loadMore}
  loadMoreThreshold={0.5}
  footer={<Text style={{ padding: 16, textAlign: "center", color: "#8c959f" }}>Loading…</Text>}
>
  {(post) => <PostRow post={post()} />}
</List>
```

Proteja-se contra carregamentos sobrepostos como acima: o final pode ser informado novamente enquanto uma página está a caminho.
<a id="loading-at-the-start-onloadmoreatstart"></a>

## Carregando no início: onLoadMoreAtStart

Uma lista também pode abrir no meio dos seus dados: um chat aberto em uma mensagem antiga (um resultado de busca, a citação de uma resposta) mostra uma página ao redor dela, com mensagens mais novas ainda por carregar. `onLoadMoreAtStart` (`.on_load_more_at_start(..)`) é disparado quando a viewport chega a `loadMoreAtStartThreshold` viewports do início (1 por padrão), o lado do item 0: o topo de uma lista, a base de uma lista invertida. Adicione a página no início: as linhas na tela mantêm sua posição enquanto ela chega antes delas (também em uma lista invertida, depois de rolada para longe da sua base), e a lista dispara novamente na próxima aproximação, ou imediatamente quando a página a deixou ainda perto do início.

O evento é disparado quando o usuário rola até lá ou quando um comando de rolagem leva a lista até lá (`initialScrollIndex` incluído); assim, uma lista que abre no seu item mais novo não pede nada, e uma aberta com `initialScrollIndex` perto do início pede a página anterior imediatamente.

```rust tabs
let messages = signal(page_around(target)); // newest first, ending at an old message
let loading = stored(false);

let load_newer = move |_: &()| {
    if loading.replace(true) {
        return;
    }
    let newest = messages.with(|m| m[0].id);
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/messages?after={newest}")).await {
            let newer = parse_messages(&response.text());
            messages.update(|m| {
                m.splice(0..0, newer);
            });
        }
        loading.replace(false);
    });
};

virtual_list(move || messages.with(Vec::len), move |at| message_row(messages, at))
    .inverted(true)
    .on_load_more(load_older)
    .on_load_more_at_start(load_newer)
    .load_more_at_start_threshold(0.5)
    .flex_1()
```

```tsx tabs
const messages = signal<Message[]>(pageAround(target)); // newest first, ending at an old message
let loading = false;

const loadNewer = async () => {
  if (loading) return;
  loading = true;
  try {
    const newest = messages()[0].id;
    const newer: Message[] = await (await fetch(`https://api.example.com/messages?after=${newest}`)).json();
    messages.set([...newer, ...messages()]);
  } finally {
    loading = false;
  }
};

<List
  each={messages()}
  inverted
  style={{ flex: 1 }}
  onLoadMore={loadOlder}
  onLoadMoreAtStart={loadNewer}
  loadMoreAtStartThreshold={0.5}
>
  {(message) => <Bubble message={message()} />}
</List>
```

Quando a mensagem mais nova já estiver carregada, pare de carregar: as novas mensagens passam a chegar no início, como em qualquer chat.

<a id="viewability"></a>

## Visibilidade

`onViewableItemsChange` (`.on_viewable_items_change(..)`) informa quais itens estão na tela, para analytics, para reproduzir automaticamente o vídeo visível ou para marcar mensagens como lidas. Em TSX ele recebe `{ viewableItems, changed }`, arrays de tokens `{ item, key, index, isViewable }`; em Rust, `ViewableItems` com a primeira e a última linha visíveis (`viewable`) e as linhas cujo estado mudou (`changed()`). A visibilidade é calculada de forma nativa; seu código só é avisado das mudanças.

| `viewabilityConfig` | Rust | Descrição |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | Quanto de um item deve estar visível, de 0 a 1. |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | Quanto da viewport um item deve cobrir, de 0 a 1. |
| `minimumViewTime` | `.minimum_view_time(Duration)` | Milissegundos que um item deve permanecer visível antes de ser informado. |

Sem um limite, qualquer pixel visível conta.

```rust tabs
let playing = signal(None::<usize>);

virtual_list(count, move |at| video_card(videos.clone(), at))
    .estimated_item_size(px(300.0))
    .viewability(Viewability {
        item_visible_threshold: Some(Percentage(0.6)),
        ..Viewability::default()
    })
    .minimum_view_time(Duration::from_millis(250))
    .on_viewable_items_change(move |rows: &ViewableItems| {
        playing.set(rows.viewable.map(|(first, _)| first))
    })
    .flex_1()
```

```tsx tabs
<List
  each={videos}
  estimatedItemSize={300}
  style={{ flex: 1 }}
  keyExtractor={(v) => v.slug}
  viewabilityConfig={{ itemVisibleThreshold: 0.6, minimumViewTime: 250 }}
  onViewableItemsChange={({ viewableItems }) => playing.set(viewableItems[0]?.key ?? null)}
>
  {(v) => <VideoCard video={v()} />}
</List>
```

<a id="scrolling-from-code"></a>

## Rolando por código

Dê uma ref à lista (`element_ref()` e `.element_ref(&list)` em Rust, `ref` em TSX):

| Rust | TSX | Descrição |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Rola o item `index` para dentro da área visível. A posição de visualização o posiciona: 0 no início da viewport (padrão), 0.5 no meio, 1 no fim; o deslocamento de visualização o desloca ainda mais. |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | Rola até um deslocamento de conteúdo ao longo do eixo da lista. |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | Rola até o fim do conteúdo (o início de uma lista invertida). |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Rola até um deslocamento, como em uma scroll view. |

```rust tabs
let list = element_ref();

virtual_list(count, row).estimated_item_size(px(48.0)).flex_1().element_ref(&list)

list.scroll_to_index(120, percentage(0.5), px(0.0), true);
```

```tsx tabs
import { List, type ListRef } from "nsh";

let list!: ListRef;

<List ref={list} each={items} estimatedItemSize={48} style={{ flex: 1 }}>…</List>

list.scrollToIndex({ index: 120, viewPosition: 0.5 });
```

A rolagem até um índice (e até o fim) é resolvida de forma nativa com os tamanhos conhecidos naquele momento: linhas medidas onde já foram medidas, o tamanho estimado nas demais. A lista então acompanha o seu alvo enquanto as linhas ao redor são medidas, de modo que chega exatamente ao destino, até que o usuário role ou os itens mudem. Para abrir uma lista em um item, use `initialScrollIndex` (`.initial_scroll_index(..)`) em vez de rolar após o primeiro frame.

<a id="a-settings-style-list"></a>

## Uma lista no estilo de configurações

A aparência de uma lista é responsabilidade do app: a lista posiciona e recicla as linhas, e as linhas, os divisores e as superfícies são suas views. Uma lista agrupada, no estilo de configurações, é uma lista com padding, um separador e a primeira e a última linhas arredondadas. Transforme-a em um componente seu e use-a sempre que o app listar configurações:

```rust tabs
use std::rc::Rc;

use nsh_core::{element::palette::NEUTRAL, prelude::*};

pub struct Setting {
    pub id: &'static str,
    pub label: &'static str,
}

pub fn settings_list(settings: Rc<Vec<Setting>>, on_select: impl Fn(&Setting) + 'static) -> impl IntoElement {
    let surface = AdaptiveColor::new(white(), NEUTRAL.shade(900));
    let on_select = Rc::new(on_select);
    let count = settings.len();
    view().flex_1().bg(AdaptiveColor::new(NEUTRAL.shade(100), NEUTRAL.shade(950))).child(
        virtual_list(count, move |at| {
            let (pressed, shown, on_select) = (settings.clone(), settings.clone(), on_select.clone());
            view()
                .on_press(move || on_select(&pressed[at.index()]))
                .role(AccessibilityRole::Button)
                .h_12()
                .justify_center()
                .bg(surface)
                .px_4()
                .active(|s| s.bg(NEUTRAL.shade(200)))
                .rounded_t(move || px(if at.is_first() { 12.0 } else { 0.0 }))
                .rounded_b(move || px(if at.is_last() { 12.0 } else { 0.0 }))
                .child(text(move || shown[at.index()].label))
        })
        .estimated_item_size(px(48.0))
        .content_padding(px(16.0))
        .separator(move || {
            view()
                .bg(surface)
                .child(view().ml_4().h(px(1.0)).bg(AdaptiveColor::new(NEUTRAL.shade(200), NEUTRAL.shade(800))))
        })
        .flex_1(),
    )
}
```

```tsx tabs
import { List, Text, View } from "nsh";

type Setting = { id: string; label: string };

function SettingsList(props: { each: Setting[]; onSelect: (s: Setting) => void }) {
  return (
    <View class="flex-1 bg-neutral-100 dark:bg-neutral-950">
      <List
        each={props.each}
        estimatedItemSize={48}
        style={{ flex: 1 }}
        contentStyle={{ padding: 16 }}
        separator={() => (
          <View class="bg-white dark:bg-neutral-900">
            <View class="ml-4 h-px bg-neutral-200 dark:bg-neutral-800" />
          </View>
        )}
      >
        {(s, i) => (
          <View
            onPress={() => props.onSelect(s())}
            role="button"
            class="h-12 justify-center bg-white px-4 active:bg-neutral-200 dark:bg-neutral-900"
            classList={{ "rounded-t-xl": i() === 0, "rounded-b-xl": i() === props.each.length - 1 }}
          >
            <Text>{s().label}</Text>
          </View>
        )}
      </List>
    </View>
  );
}
```

<a id="performance-notes"></a>

## Notas de desempenho

- Cada célula tem o layout calculado de forma independente, então a rolagem só recalcula o layout das células que mudaram. Mantenha as linhas rasas e evite ler signals em linhas que mudam a cada frame.
- O lado nativo pede células em lotes, em até várias rodadas por frame, combinadas em uma única atualização; um fling rápido associa muitas células em um frame sem uma chamada ao seu código por célula. As linhas em Rust são associadas no próprio core, dentro do commit que precisa delas.
- Use [`nsh test --trace` com um passo `scroll`](./testing-and-trace.md#scrolling) para medir o custo por frame das suas linhas.

<a id="related"></a>

## Relacionados

- [Elemento `List`](../elements/list.md): a referência.
- [Rolagem](./scrolling.md): as props de rolagem que as listas compartilham com as scroll views.
- [Reatividade](./reactivity.md): por que as linhas leem sua posição em bindings.
- [Desempenho](./performance.md): como medir listas.
