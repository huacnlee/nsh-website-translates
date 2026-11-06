---
title: "Tree"
description: "Tree: itens que contêm itens, expandidos e recolhidos, com um deles selecionado: os arquivos de um projeto, uma barra lateral de configurações, uma estrutura de tópicos. Virtualizado, uma única parada do foco do teclado, uma árvore para leitores de tela. A aparência de cada linha é definida pelo app."
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---


# Tree

Uma árvore mostra itens que contêm itens: os arquivos e pastas de um projeto, as seções da barra lateral de configurações, a estrutura de tópicos de um documento. `Tree` é responsável pelo comportamento de uma árvore: quais itens estão expandidos, qual está selecionado, o teclado e o que os leitores de tela anunciam. Suas linhas são virtualizadas: apenas as linhas visíveis são criadas, e os filhos de um item recolhido nunca são criados, então uma árvore com milhares de itens abre e rola instantaneamente. A aparência é do app: a árvore não desenha nada por conta própria, e o app estiliza cada linha (`itemClass`) e desenha seu conteúdo (`renderItem`: um ícone, o rótulo recuado de acordo com a profundidade do item, um chevron, um selo).

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Tree` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Os itens expandidos e o item selecionado pertencem ao app quando ele define `expanded` e `selected`, que ele atualiza em `onExpandedChange` e `onSelectedChange`; sem eles, a árvore mantém seu próprio estado, começando de `defaultExpanded` e `defaultSelected`. Os itens são identificados por seu `id`, definido pelo próprio app (um caminho, a chave de um registro), nunca pelo rótulo. Em Rust, `tree()` a cria, com um setter por prop (`.items(..)`, `.expanded(..)`, `.render_item(..)`), um método de listener por evento e os métodos de estilo tipados.

<a id="items"></a>

## Itens

`items` são os itens do topo, cada um um `TreeItem`:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O que o identifica em `expanded`, `selected` e nos eventos: único na árvore (um id repetido é registrado no log, e somente o primeiro item com ele é expandido ou selecionado). |
| `label` | `string` | O que sua linha mostra, a menos que `renderItem` a desenhe, o que os leitores de tela dizem e o que a busca por digitação (typeahead) compara. |
| `children` | `TreeItem[]` | Os itens abaixo dele, em ordem. Se houver algum, ele é uma pasta: expande e recolhe. |
| `disabled` | `boolean` | O usuário não pode selecioná-lo, expandi-lo nem recolhê-lo: toques e teclas o ignoram, e os estilos de `disabled:` se aplicam. Seus filhos permanecem como `expanded` determina. |

`renderItem` recebe um `TreeEntry` para cada linha visível: o `id`, o `label` e o `disabled` do item, sua `depth` (0 no topo, 1 sob um item do topo, …) e se ele é um `folder`. Isso é o que o item é, e os estados da linha são suas classes: o desenho é feito uma vez por item e mantém suas views enquanto a linha é selecionada, expandida ou recolhida, de modo que um chevron gira com uma transição.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | Os itens do topo, cada um com os itens abaixo dele. |
| `expanded` | `.expanded(..)` | `string[]` | nenhum | Os ids dos itens expandidos (controlado). Um item é exibido enquanto todos os itens acima dele estiverem expandidos. |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | Os itens expandidos inicialmente, enquanto `expanded` não está definido. |
| `selected` | `.selected(..)` | `string \| null` | nenhum | O id do item selecionado (controlado), `null` para nenhum. |
| `defaultSelected` | `.default_selected(..)` | `string` | nenhum | O item selecionado inicialmente, enquanto `selected` não está definido. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Uma árvore somente leitura: sem toques nem teclas, sem parada do foco do teclado, `disabled:` em todas as linhas; ela mostra o que `expanded` e `selected` determinam. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | Expandir e recolher movem as linhas após o item para suas novas posições com uma mola (spring), executada nativamente. Desativado com movimento reduzido. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam a árvore ("Files"). |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | nenhum | O conteúdo de uma linha, para as linhas visíveis; sem ele, a linha mostra o rótulo do item. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | Cada linha: sua altura, preenchimento, superfície e estados (abaixo); seus estilos de texto chegam ao rótulo. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A scroll view das linhas dentro da árvore: seu preenchimento e seus espaçamentos. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A própria árvore. Dê a ela uma altura (ou `flex-1` em um pai que tenha uma): as linhas rolam dentro dela, e somente as visíveis são criadas. |

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | O usuário expandiu ou recolheu um item (um toque, Return, Espaço, Seta para a direita ou Seta para a esquerda, `revealItem`): os ids expandidos como ficariam. |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | O usuário selecionou outro item (um toque, as setas, Home, End, typeahead). |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | O usuário expandiu o item de `id`, após `onExpandedChange`. |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | O usuário recolheu o item de `id`, após `onExpandedChange`. |
| `onAction` | `.on_action(..)` | `{ id: string }` | O usuário agiu sobre o item de `id`: Return no item selecionado quando ele não tem filhos, ou um clique duplo ou toque duplo em qualquer item, após os eventos do próprio toque. Itens desabilitados e uma árvore desabilitada nunca o reportam. |

A seleção acompanha as setas do teclado, então um explorador de arquivos abre um arquivo em `onAction`, não em `onSelectedChange`: percorrer os arquivos os exibe em pré-visualização um a um, e Return ou um clique duplo abre o que o usuário deseja.

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| A árvore | | `class`, `style` | |
| A lista | a árvore | `listClass`, `listStyle` | |
| Uma linha | a lista | `itemClass`, `itemStyle` | `selected:`, `aria-expanded:` (uma pasta que está aberta), `focus:` (enquanto a árvore tem o foco do teclado, a linha sobre a qual as teclas agem: a linha selecionada, o item recolhido sob o qual uma seleção oculta se encontra, ou a primeira linha enquanto nada está selecionado), `disabled:`, `hover:`, `active:` |
| O conteúdo de uma linha | uma linha | `renderItem` | `group-selected:`, `group-aria-expanded:`, `group-focus:`, `group-disabled:` sob `group` em `itemClass` |

Mostre a linha selecionada com `selected:` e a posição do teclado com `focus:` (veja [Guias de design](../docs/design-guides.md#interaction-states)). Desenhe o foco dentro da linha (`focus:outline-2 focus:-outline-offset-2`): a lista corta o que ultrapassa suas laterais.

## Ref

| Método | Descrição |
|---|---|
| `focus()` | Recebe o foco do teclado, como quando Tab chega à árvore. |
| `revealItem(id)` | Expande os itens acima do item de `id` (reportado com `onExpandedChange` e `onExpand`, do mais externo para o mais interno) e rola sua linha para a área visível assim que ela é exibida: quando o app acompanha a mudança, imediatamente; quando não acompanha, a solicitação termina ali. |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

<a id="disabled"></a>

## Desabilitado

Um item desabilitado não recebe toques, as setas o ignoram e os leitores de tela o anunciam como esmaecido. `disabled` na árvore a torna somente leitura: ela mostra o que o estado do app determina e não aceita entrada.

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## Acessibilidade

- A árvore tem o papel `"tree"`, nomeada por `accessibilityLabel`; cada linha é um `"treeitem"` nomeado pelo rótulo de seu item, com seu nível (sua profundidade + 1), se está expandido (pastas), selecionado e desabilitado.
- Quando a árvore recebe o foco do teclado e quando as teclas movem a seleção, a linha sobre a qual as teclas agem recebe o foco do leitor de tela.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="keyboard"></a>

## Teclado

Nos desktops e na web, onde Tab alcança as views que recebem toques, um `Tree` segue o [padrão de tree view do WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| Tecla | O que faz |
|---|---|
| Tab, Shift+Tab | Entra na árvore em uma etapa e sai dela em uma etapa; ao voltar, as teclas continuam a partir da linha selecionada. Sem nenhuma seleção, o foco aparece na primeira linha, que a Seta para baixo seleciona. |
| Seta para baixo, Seta para cima | Seleciona a próxima ou a linha anterior, pulando itens desabilitados, da última para a primeira e vice-versa. |
| Seta para a direita | Expande uma pasta recolhida; em uma já expandida, seleciona seu primeiro filho habilitado. |
| Seta para a esquerda | Recolhe uma pasta expandida; em qualquer outro caso, seleciona o pai. |
| Home, End | Seleciona a primeira ou a última linha. |
| Return | Expande ou recolhe a pasta selecionada; em um item sem filhos, age sobre ele (`onAction`). |
| Espaço | Expande ou recolhe a pasta selecionada. |
| Letras, dígitos | Seleciona a próxima linha cujo rótulo começa com o que foi digitado. |

Enquanto a seleção está oculta sob um item recolhido (o app o recolheu), as teclas agem sobre a linha desse item: Seta para a direita ou Return o expande, Seta para baixo seleciona a linha seguinte a ele.

Em um layout da direita para a esquerda, as linhas fluem a partir da direita, então Seta para a esquerda e Seta para a direita trocam de lugar, como diz o padrão: Seta para a esquerda expande uma pasta e entra nela, Seta para a direita a recolhe e seleciona o pai. Seta para cima, Seta para baixo, Home e End permanecem como são.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: um toque seleciona uma linha e expande ou recolhe uma pasta; um toque duplo age sobre o item (`onAction`).
- Desktops (macOS, Windows, Linux, GPUI) e a web: um clique faz o mesmo e dá à árvore o foco do teclado, e as teclas acima se movem nela; um clique duplo age sobre o item.
- Todas as plataformas desenham o que o app estiliza: a árvore, suas linhas e o conteúdo delas.
